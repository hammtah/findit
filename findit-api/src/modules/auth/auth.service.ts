import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { createPublicKey } from 'crypto';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { decode as decodeJwt } from 'jsonwebtoken';
import { Resend } from 'resend';
import { User, AuthProvider } from '../users/user.entity';
import { EmailVerification } from './email-verification.entity';
import { PasswordReset } from './password-reset.entity';
import { RefreshToken } from './refresh-token.entity';
import {
  AccessTokenPayload,
  AppleIdentityPayload,
  AuthResponse,
  AuthTokens,
  GoogleCallbackResult,
  GoogleOAuthProfile,
  RefreshTokenPayload,
  SerializedAuthUser,
} from './auth.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AppleCallbackDto } from './dto/apple-callback.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const resendApiKey = this.configService.get<string>('resend.apiKey') ?? '';
    this.resend = new Resend(resendApiKey);
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const nom = dto.nom.trim();

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      if (
        existing.provider === AuthProvider.EMAIL &&
        existing.email_verified === false
      ) {
        await this.issueAndSendEmailVerification(existing);
        return { message: 'Verification email sent' };
      }

      throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email,
        nom,
        password_hash: passwordHash,
        provider: AuthProvider.EMAIL,
        email_verified: false,
        is_active: false,
      }),
    );

    await this.issueAndSendEmailVerification(user);

    return { message: 'Verification email sent' };
  }

  async resendVerificationEmail(
    emailInput: string,
  ): Promise<{ message: string }> {
    const email = emailInput.toLowerCase().trim();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (
      user &&
      user.provider === AuthProvider.EMAIL &&
      user.email_verified === false
    ) {
      await this.issueAndSendEmailVerification(user);
    }

    return { message: 'If account exists, verification email sent' };
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const verification = await this.emailVerificationRepository
      .createQueryBuilder('verification')
      .leftJoinAndSelect('verification.user', 'user')
      .where('verification.token = :token', { token })
      .andWhere('verification.used = false')
      .andWhere('verification.expires_at > :now', { now: new Date() })
      .getOne();

    if (!verification?.user) {
      throw new BadRequestException({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    verification.used = true;
    await this.emailVerificationRepository.save(verification);

    verification.user.email_verified = true;
    verification.user.is_active = true;
    const user = await this.usersRepository.save(verification.user);

    const tokens = await this.generateTokens(user.id);
    return {
      ...tokens,
      user: this.serializeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }

    if (!user.email_verified) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED' });
    }

    if (user.is_suspended) {
      throw new ForbiddenException({ code: 'ACCOUNT_SUSPENDED' });
    }

    const tokens = await this.generateTokens(user.id);
    return {
      ...tokens,
      user: this.serializeUser(user),
    };
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(dto.refresh_token);
    const matchingToken = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refresh_token,
    );

    if (!matchingToken) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    matchingToken.revoked = true;
    await this.refreshTokenRepository.save(matchingToken);

    return this.generateTokens(payload.sub);
  }

  async logout(userId: string, dto: RefreshDto): Promise<{ message: string }> {
    const matchingToken = await this.findMatchingRefreshToken(
      userId,
      dto.refresh_token,
    );

    if (matchingToken) {
      matchingToken.revoked = true;
      await this.refreshTokenRepository.save(matchingToken);
    }

    return { message: 'Logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (user && user.email_verified) {
      const token = uuid();
      await this.passwordResetRepository.save(
        this.passwordResetRepository.create({
          user_id: user.id,
          token,
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          used: false,
        }),
      );

      await this.sendPasswordResetEmail(user.email, token);
    }

    return { message: 'If account exists, reset instructions were sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetRecord = await this.passwordResetRepository
      .createQueryBuilder('reset')
      .leftJoinAndSelect('reset.user', 'user')
      .where('reset.token = :token', { token: dto.token })
      .andWhere('reset.used = false')
      .andWhere('reset.expires_at > :now', { now: new Date() })
      .getOne();

    if (!resetRecord?.user) {
      throw new BadRequestException({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    resetRecord.user.password_hash = await bcrypt.hash(dto.new_password, 12);
    await this.usersRepository.save(resetRecord.user);

    resetRecord.used = true;
    await this.passwordResetRepository.save(resetRecord);

    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked: true })
      .where('user_id = :userId', { userId: resetRecord.user.id })
      .andWhere('revoked = false')
      .execute();

    return { message: 'Password reset successful' };
  }

  async handleGoogleCallback(
    oauthProfile: GoogleOAuthProfile,
  ): Promise<GoogleCallbackResult> {
    let user = await this.usersRepository.findOne({
      where: [
        { email: oauthProfile.email },
        { provider_id: oauthProfile.googleId },
      ],
    });

    if (!user) {
      user = await this.usersRepository.save(
        this.usersRepository.create({
          email: oauthProfile.email,
          nom: oauthProfile.nom,
          photo_url: oauthProfile.photo_url,
          provider: AuthProvider.GOOGLE,
          provider_id: oauthProfile.googleId,
          email_verified: true,
          is_active: true,
          password_hash: null,
        }),
      );
    } else {
      user.provider = AuthProvider.GOOGLE;
      user.provider_id = oauthProfile.googleId;
      user.email_verified = true;
      user.is_active = true;
      if (!user.photo_url && oauthProfile.photo_url) {
        user.photo_url = oauthProfile.photo_url;
      }
      if (!user.nom && oauthProfile.nom) {
        user.nom = oauthProfile.nom;
      }
      user = await this.usersRepository.save(user);
    }

    const tokens = await this.generateTokens(user.id);
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? '';
    const redirectUrl = `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(tokens.access_token)}&refresh_token=${encodeURIComponent(tokens.refresh_token)}`;

    return { redirectUrl };
  }

  async appleCallback(dto: AppleCallbackDto): Promise<AuthResponse> {
    const identity = await this.verifyAppleIdentityToken(dto.identity_token);

    const appleSubject = identity.sub;
    if (!appleSubject) {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }

    const normalizedEmail = identity.email?.toLowerCase().trim();

    let user = await this.usersRepository.findOne({
      where: normalizedEmail
        ? [{ email: normalizedEmail }, { provider_id: appleSubject }]
        : [{ provider_id: appleSubject }],
    });

    if (!user) {
      if (!normalizedEmail) {
        throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
      }

      user = await this.usersRepository.save(
        this.usersRepository.create({
          email: normalizedEmail,
          nom: dto.nom?.trim() || normalizedEmail.split('@')[0],
          provider: AuthProvider.APPLE,
          provider_id: appleSubject,
          email_verified: true,
          is_active: true,
          password_hash: null,
        }),
      );
    } else {
      user.provider = AuthProvider.APPLE;
      user.provider_id = appleSubject;
      user.email_verified = true;
      user.is_active = true;
      if (dto.nom?.trim()) {
        user.nom = dto.nom.trim();
      }
      user = await this.usersRepository.save(user);
    }

    const tokens = await this.generateTokens(user.id);
    return {
      ...tokens,
      user: this.serializeUser(user),
    };
  }

  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const accessExpiry =
      this.configService.get<string>('jwt.accessExpiry') ?? '15m';
    const refreshExpiry =
      this.configService.get<string>('jwt.refreshExpiry') ?? '30d';

    if (!accessSecret || !refreshSecret) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED' });
    }

    const accessPayload: AccessTokenPayload = { sub: userId, type: 'access' };
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      jti: uuid(),
      type: 'refresh',
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: this.parseExpiryToSeconds(accessExpiry),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: this.parseExpiryToSeconds(refreshExpiry),
      }),
    ]);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        user_id: userId,
        token_hash: await bcrypt.hash(refresh_token, 10),
        expires_at: this.calculateExpiryDate(refreshExpiry),
        revoked: false,
      }),
    );

    return { access_token, refresh_token };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: refreshSecret,
        },
      );

      if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
        throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
      }

      return payload;
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }
  }

  private async findMatchingRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const activeTokens = await this.refreshTokenRepository.find({
      where: { user_id: userId, revoked: false },
      order: { created_at: 'DESC' },
    });

    const now = new Date();
    for (const tokenEntity of activeTokens) {
      if (tokenEntity.expires_at <= now) {
        continue;
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        tokenEntity.token_hash,
      );
      if (isMatch) {
        return tokenEntity;
      }
    }

    return null;
  }

  private async verifyAppleIdentityToken(
    identityToken: string,
  ): Promise<AppleIdentityPayload> {
    const decoded = decodeJwt(identityToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }

    const kid =
      typeof decoded.header.kid === 'string' ? decoded.header.kid : null;
    if (!kid) {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }

    const response = await fetch('https://appleid.apple.com/auth/keys');
    if (!response.ok) {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }

    const keysPayload = (await response.json()) as {
      keys?: Array<{
        kid: string;
        kty: string;
        alg: string;
        use: string;
        n: string;
        e: string;
      }>;
    };

    const jwk = keysPayload.keys?.find((key) => key.kid === kid);
    if (!jwk) {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }

    const appleClientId = this.configService.get<string>('oauth.appleClientId');

    try {
      const publicKey = createPublicKey({ key: jwk, format: 'jwk' }).export({
        type: 'spki',
        format: 'pem',
      });

      return await this.jwtService.verifyAsync<AppleIdentityPayload>(
        identityToken,
        {
          publicKey:
            typeof publicKey === 'string'
              ? publicKey
              : publicKey.toString('utf8'),
          algorithms: ['RS256'],
          issuer: 'https://appleid.apple.com',
          audience: appleClientId || undefined,
        },
      );
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_APPLE_TOKEN' });
    }
  }

  private async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? '';
    const from = this.configService.get<string>('resend.from') ?? '';
    const link = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    const { data, error } = await this.resend.emails.send({
      from,
      to: email,
      subject: 'Vérifie ton email',
      html: `<p>Bienvenue</p><p>Clique sur ce lien pour vérifier ton email :</p><p><a href="${link}">${link}</a></p>`,
    });

    if (error) {
      this.logger.error(
        `Resend verification email failed for ${email}: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException({ code: 'EMAIL_SEND_FAILED' });
    }

    this.logger.log(
      `Verification email queued for ${email} (id: ${data?.id ?? 'n/a'})`,
    );
  }

  private async issueAndSendEmailVerification(user: User): Promise<void> {
    const token = uuid();

    await this.emailVerificationRepository
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ used: true })
      .where('user_id = :userId', { userId: user.id })
      .andWhere('used = false')
      .execute();

    await this.emailVerificationRepository.save(
      this.emailVerificationRepository.create({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
      }),
    );

    await this.sendVerificationEmail(user.email, token);
  }

  private async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? '';
    const from = this.configService.get<string>('resend.from') ?? '';
    const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const { data, error } = await this.resend.emails.send({
      from,
      to: email,
      subject: 'Réinitialisation du mot de passe',
      html: `<p>Tu as demandé une réinitialisation de mot de passe.</p><p><a href="${link}">Réinitialiser mon mot de passe</a></p>`,
    });

    if (error) {
      this.logger.error(
        `Resend password reset email failed for ${email}: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException({ code: 'EMAIL_SEND_FAILED' });
    }

    this.logger.log(
      `Password reset email queued for ${email} (id: ${data?.id ?? 'n/a'})`,
    );
  }

  private serializeUser(user: User): SerializedAuthUser {
    return {
      id: user.id,
      nom: user.nom,
      email: user.email,
      photo_url: user.photo_url ?? null,
    };
  }

  private calculateExpiryDate(expiry: string | number): Date {
    const seconds = this.parseExpiryToSeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpiryToSeconds(expiry: string | number): number {
    if (typeof expiry === 'number') {
      return expiry;
    }

    const match = expiry.match(/^(\d+)([smhd])$/i);
    if (!match) {
      const seconds = Number.parseInt(expiry, 10);
      if (Number.isNaN(seconds)) {
        return 30 * 24 * 60 * 60;
      }
      return seconds;
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const factorByUnit: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return Math.floor((value * factorByUnit[unit]) / 1000);
  }
}
