import { useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { uploadApi } from '../../api/upload.api';
import { usersApi } from '../../api/users.api';
import { colors, spacing, typography } from '../../constants/theme';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const [nom, setNom] = useState(user?.nom ?? '');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      try {
        const { url } = await uploadApi.uploadImage(result.assets[0].uri);
        setPhotoUrl(url);
      } catch {
        Alert.alert('Erreur', "Impossible d'uploader l'image.");
      } finally {
        setUploading(false);
      }
    }
  };

  const save = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({ nom, photo_url: photoUrl });
      updateUser(updated);
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Photo</Text>
      <View style={styles.photoRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder} />
        )}
        <Button title="Changer la photo" onPress={pickImage} disabled={uploading} />
      </View>
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        editable={!saving}
        maxLength={100}
      />
      <Button title="Sauvegarder" onPress={save} disabled={saving || uploading || !nom.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  label: { ...typography.body, marginBottom: spacing.xs },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  photo: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background.secondary },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background.secondary },
  input: { ...typography.body, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.lg },
});
