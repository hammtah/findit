import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(64).required(),
  JWT_REFRESH_SECRET: Joi.string().min(64).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  FRONTEND_URL: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  MODERATION_NEW_USER_REPORTS: Joi.number().default(3),
  MATCH_SCORE_THRESHOLD: Joi.number().default(0.5),
  MAX_PUSH_NOTIFS_PER_DAY: Joi.number().default(3),
});

export default () => ({
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL,
    moderationNewUserReports: parseInt(
      process.env.MODERATION_NEW_USER_REPORTS ?? '3',
      10,
    ),
    matchScoreThreshold: parseFloat(process.env.MATCH_SCORE_THRESHOLD ?? '0.5'),
    maxPushNotifsPerDay: parseInt(
      process.env.MAX_PUSH_NOTIFS_PER_DAY ?? '3',
      10,
    ),
    devMode: process.env.DEV_MODE === 'true',
  },
});
