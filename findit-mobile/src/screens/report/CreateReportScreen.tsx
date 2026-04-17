import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { reportsApi } from '../../api/reports.api';
import { uploadApi } from '../../api/upload.api';
import { Button } from '../../components/shared/Button';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Input } from '../../components/shared/Input';
import { CATEGORIES, CategoryValue } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { handleApiError } from '../../utils/handleApiError';

const reportSchema = z
  .object({
    type: z.enum(['lost', 'found']),
    titre: z.string().min(3, 'Minimum 3 caractères').max(80, 'Maximum 80 caractères'),
    description: z.string().min(10, 'Minimum 10 caractères').max(1000, 'Maximum 1000 caractères'),
    categorie: z.enum([
      'cles',
      'electronique',
      'vetements',
      'papiers',
      'animaux',
      'sac',
      'bijoux',
      'autre',
    ]),
    date_evenement: z
      .string()
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Date invalide')
      .refine((value) => new Date(value) <= new Date(), {
        message: 'La date ne peut pas être dans le futur',
      }),
    heure_evenement: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Format attendu: HH:MM')
      .or(z.literal(''))
      .optional(),
    adresse: z.string().min(5, 'Adresse requise'),
    latitude: z.number(),
    longitude: z.number(),
    photos: z.array(z.string()).max(5, 'Maximum 5 photos'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'found' && data.photos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['photos'],
        message: 'Au moins une photo requise pour un objet trouvé',
      });
    }
  });

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportDetailResponse {
  id: string;
  type: 'lost' | 'found';
  titre: string;
  description: string;
  categorie: CategoryValue;
  statut: 'en_attente' | 'resolu' | 'rendu';
  adresse: string;
  photos: string[];
  date_evenement: string;
  heure_evenement: string | null;
}

interface UploadedPhoto {
  id: string;
  localUri?: string;
  remoteUrl?: string;
  isUploading: boolean;
  error?: string;
}

const defaultValues: ReportFormValues = {
  type: 'lost',
  titre: '',
  description: '',
  categorie: 'autre',
  date_evenement: new Date().toISOString().slice(0, 10),
  heure_evenement: '',
  adresse: '',
  latitude: 0,
  longitude: 0,
  photos: [],
};

export function CreateReportScreen({ route, navigation }: any) {
  const routeParams = route?.params as { type?: 'lost' | 'found'; reportId?: string } | undefined;
  const reportId = routeParams?.reportId;
  const initialType = routeParams?.type ?? 'lost';
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(reportId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      ...defaultValues,
      type: initialType,
    },
  });

  const currentType = watch('type');
  const adresse = watch('adresse');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const watchedPhotos = watch('photos');
  const descriptionValue = watch('description');
  const titreValue = watch('titre');

  const syncPhotos = useCallback((nextPhotos: UploadedPhoto[]) => {
    setPhotos(nextPhotos);
    setValue(
      'photos',
      nextPhotos
        .map((photo) => photo.remoteUrl)
        .filter((value): value is string => Boolean(value)),
      { shouldValidate: true },
    );
  }, [setValue]);

  useEffect(() => {
    if (!reportId) return;

    const loadReport = async () => {
      setIsBootstrapping(true);
      try {
        const report = await reportsApi.getReport<ReportDetailResponse & { latitude?: number; longitude?: number }>(
          reportId,
        );
        reset({
          type: report.type,
          titre: report.titre,
          description: report.description,
          categorie: report.categorie,
          date_evenement: report.date_evenement.slice(0, 10),
          heure_evenement: report.heure_evenement ?? '',
          adresse: report.adresse,
          latitude: report.latitude ?? 0,
          longitude: report.longitude ?? 0,
          photos: report.photos,
        });
        setPhotos(
          report.photos.map((photo, index) => ({
            id: `${index}-${photo}`,
            remoteUrl: photo,
            isUploading: false,
          })),
        );
      } catch (err) {
        setSubmitError(handleApiError(err));
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadReport();
  }, [reportId, reset]);

  const statusText = useMemo(() => {
    if (!latitude && !longitude) {
      return 'Position non confirmée';
    }
    return 'Position confirmée';
  }, [latitude, longitude]);

  const geocodeAddress = useCallback(async (address: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      address,
    )}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error("Impossible de géocoder l'adresse.");
    }
    const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) {
      throw new Error('Adresse introuvable.');
    }
    return {
      latitude: Number.parseFloat(data[0].lat),
      longitude: Number.parseFloat(data[0].lon),
      address: data[0].display_name,
    };
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    const nativeResults = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });

    const nativeAddress = nativeResults[0];
    if (nativeAddress) {
      const parts = [
        nativeAddress.name,
        nativeAddress.street,
        nativeAddress.postalCode,
        nativeAddress.city,
        nativeAddress.region,
        nativeAddress.country,
      ].filter((part): part is string => Boolean(part && part.trim()));

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error("Impossible d'obtenir l'adresse.");
    }
    const data = (await response.json()) as { display_name?: string };
    if (!data.display_name) {
      throw new Error('Adresse indisponible.');
    }
    return data.display_name;
  }, []);

  const getLocationErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message === 'LOCATION_TIMEOUT') {
        return 'La localisation a pris trop de temps. Réessayez dans un endroit avec un meilleur signal GPS.';
      }
      if (
        error.message.toLowerCase().includes('location services') ||
        error.message.toLowerCase().includes('location provider')
      ) {
        return 'Activez la localisation (GPS) dans les paramètres de votre téléphone puis réessayez.';
      }
    }

    return "Impossible de récupérer votre position actuelle. Vérifiez vos permissions et le GPS.";
  };

  const handleUseCurrentPosition = async () => {
    setIsResolvingAddress(true);
    setSubmitError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour récupérer votre position.');
        return;
      }

      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setSubmitError('Activez la localisation (GPS) dans les paramètres de votre téléphone puis réessayez.');
        return;
      }

      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 12000);
        }),
      ]).catch(async (error) => {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) return lastKnown;
        throw error;
      });

      const nextLatitude = position.coords.latitude;
      const nextLongitude = position.coords.longitude;

      setValue('latitude', nextLatitude, { shouldValidate: true });
      setValue('longitude', nextLongitude, { shouldValidate: true });

      try {
        const resolvedAddress = await reverseGeocode(nextLatitude, nextLongitude);
        setValue('adresse', resolvedAddress, { shouldValidate: true });
      } catch {
        setValue('adresse', `${nextLatitude.toFixed(6)}, ${nextLongitude.toFixed(6)}`, {
          shouldValidate: true,
        });
      }
    } catch (err) {
      setSubmitError(getLocationErrorMessage(err));
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleConfirmAddress = async () => {
    if (!adresse.trim()) {
      setError('adresse', { message: 'Adresse requise' });
      return;
    }

    setIsResolvingAddress(true);
    setSubmitError(null);
    try {
      const result = await geocodeAddress(adresse.trim());
      setValue('adresse', result.address, { shouldValidate: true });
      setValue('latitude', result.latitude, { shouldValidate: true });
      setValue('longitude', result.longitude, { shouldValidate: true });
    } catch (err) {
      setSubmitError(handleApiError(err));
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 5) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire pour ajouter une photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    const photoId = `${Date.now()}-${Math.random()}`;
    const pendingPhoto: UploadedPhoto = {
      id: photoId,
      localUri: asset.uri,
      isUploading: true,
    };
    const pendingList = [...photos, pendingPhoto];
    syncPhotos(pendingList);

    try {
      const uploaded = await uploadApi.uploadImage(asset.uri);
      syncPhotos(
        pendingList.map((photo) =>
          photo.id === photoId
            ? {
                ...photo,
                remoteUrl: uploaded.url,
                isUploading: false,
              }
            : photo,
        ),
      );
    } catch (err) {
      syncPhotos(
        pendingList.map((photo) =>
          photo.id === photoId
            ? {
                ...photo,
                isUploading: false,
                error: handleApiError(err),
              }
            : photo,
        ),
      );
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    syncPhotos(photos.filter((photo) => photo.id !== photoId));
  };

  const mapApiErrors = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('titre')) {
      setError('titre', { message });
      return;
    }
    if (normalized.includes('description')) {
      setError('description', { message });
      return;
    }
    if (normalized.includes('adresse')) {
      setError('adresse', { message });
      return;
    }
    if (normalized.includes('photo')) {
      setError('photos', { message });
      return;
    }
    setSubmitError(message);
  };

  const onSubmit = async (values: ReportFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...values,
      heure_evenement: values.heure_evenement || undefined,
    };

    try {
      const response = reportId
        ? await reportsApi.updateReport<{ id: string }>(reportId, payload)
        : await reportsApi.createReport<{ id: string }>(payload);

      navigation.navigate(ROUTES.FEED, {
        screen: ROUTES.REPORT_DETAIL,
        params: { reportId: response.id ?? reportId },
      });
    } catch (err) {
      mapApiErrors(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{reportId ? 'Modifier le signalement' : 'Créer un signalement'}</Text>

      {submitError ? <ErrorMessage message={submitError} /> : null}

      {!reportId ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.row}>
            <TypeButton
              label="Perdu"
              selected={currentType === 'lost'}
              onPress={() => setValue('type', 'lost', { shouldValidate: true })}
            />
            <TypeButton
              label="Trouvé"
              selected={currentType === 'found'}
              onPress={() => setValue('type', 'found', { shouldValidate: true })}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>

        <Controller
          control={control}
          name="titre"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Titre"
              value={value}
              onChangeText={onChange}
              error={errors.titre?.message}
              placeholder="Ex: Sac à dos noir perdu"
            />
          )}
        />
        <Text style={styles.counterText}>{titreValue.length}/80</Text>

        <Text style={styles.subTitle}>Catégorie</Text>
        <Controller
          control={control}
          name="categorie"
          render={({ field: { value } }) => (
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((category) => {
                const selected = value === category.value;
                return (
                  <Pressable
                    key={category.value}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    onPress={() =>
                      setValue('categorie', category.value, { shouldValidate: true })
                    }
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        selected && styles.categoryLabelSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description"
              value={value}
              onChangeText={onChange}
              error={errors.description?.message}
              placeholder="Décrivez l'objet, le contexte et tout détail utile"
              multiline
              style={styles.textarea}
            />
          )}
        />
        <Text style={styles.counterText}>{descriptionValue.length}/1000</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date et heure</Text>
        <Controller
          control={control}
          name="date_evenement"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date"
              value={value}
              onChangeText={onChange}
              error={errors.date_evenement?.message}
              placeholder="YYYY-MM-DD"
            />
          )}
        />
        <Controller
          control={control}
          name="heure_evenement"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Heure (optionnel)"
              value={value ?? ''}
              onChangeText={onChange}
              error={errors.heure_evenement?.message}
              placeholder="HH:MM"
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lieu</Text>
        <Button
          title={isResolvingAddress ? 'Localisation...' : 'Utiliser ma position actuelle'}
          variant="secondary"
          onPress={handleUseCurrentPosition}
          disabled={isResolvingAddress}
          containerStyle={styles.buttonSpacing}
        />

        <Controller
          control={control}
          name="adresse"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Adresse"
              value={value}
              onChangeText={onChange}
              error={errors.adresse?.message}
              placeholder="Rue, ville, quartier..."
            />
          )}
        />

        <Button
          title={isResolvingAddress ? 'Vérification...' : "Confirmer l'adresse"}
          variant="ghost"
          onPress={handleConfirmAddress}
          disabled={isResolvingAddress}
          containerStyle={styles.buttonSpacing}
        />

        <Text style={styles.locationStatus}>
          {statusText} {latitude && longitude ? '✓' : '✗'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              {photo.localUri || photo.remoteUrl ? (
                <Image
                  source={{ uri: photo.remoteUrl ?? photo.localUri }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ) : null}
              <Pressable
                style={styles.removePhotoButton}
                onPress={() => handleRemovePhoto(photo.id)}
              >
                <Text style={styles.removePhotoText}>×</Text>
              </Pressable>
              {photo.isUploading ? (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator color={colors.text.inverse} />
                </View>
              ) : null}
            </View>
          ))}

          {photos.length < 5 ? (
            <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
              <Text style={styles.addPhotoIcon}>+</Text>
            </Pressable>
          ) : null}
        </View>

        {errors.photos?.message ? (
          <Text style={styles.photoError}>{errors.photos.message}</Text>
        ) : null}

        {currentType === 'found' && watchedPhotos.length === 0 ? (
          <Text style={styles.warningText}>
            Au moins une photo est requise pour un objet trouvé.
          </Text>
        ) : null}
      </View>

      <Button
        title={isSubmitting ? 'Enregistrement...' : reportId ? 'Mettre à jour' : 'Publier'}
        variant="primary"
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting || photos.some((photo) => photo.isUploading)}
        containerStyle={styles.submitButton}
      />
    </ScrollView>
  );
}

function TypeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.typeButton, selected && styles.typeButtonSelected]} onPress={onPress}>
      <Text style={[styles.typeButtonText, selected && styles.typeButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background.card,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  typeButtonTextSelected: {
    color: colors.primary,
  },
  counterText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    width: '47%',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.background.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  categoryLabelSelected: {
    color: colors.primary,
  },
  textarea: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  buttonSpacing: {
    marginBottom: spacing.md,
  },
  locationStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background.secondary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  addPhotoIcon: {
    fontSize: 28,
    color: colors.primary,
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: colors.text.inverse,
    fontSize: 18,
    lineHeight: 20,
  },
  photoError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
