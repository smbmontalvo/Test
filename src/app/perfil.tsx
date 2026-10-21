import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { showAlert } from '../components/Dialog';
import { Button } from '../components/ui';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import { useScreenInsets } from '../hooks/useScreenInsets';
import { TopBar } from '../components/TopBar';

export default function ProfileScreen() {
  const inset = useScreenInsets();
  const { profile, updateProfile } = useGym();
  const [name, setName] = useState(profile.name);
  const [alias, setAlias] = useState(profile.alias);
  const [photo, setPhoto] = useState(profile.photo);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Sin acceso a tus fotos', 'Permite el acceso a la galería en los ajustes del teléfono para elegir una foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhoto(asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri);
  };

  const save = () => {
    updateProfile({ name: name.trim(), alias: alias.trim(), photo });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.xl, paddingBottom: inset.bottom + spacing.xl }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }} keyboardShouldPersistTaps="handled">
        <TopBar />
        <View style={styles.photoBlock}>
          <Avatar profile={{ name, alias, photo }} size={112} />
          <View style={styles.photoActions}>
            <Button title={photo ? 'Cambiar foto' : 'Elegir foto'} icon="camera" variant="secondary" onPress={pickPhoto} />
            {photo && <Button title="Quitar foto" variant="ghost" onPress={() => setPhoto(undefined)} />}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label} nativeID="label-name">
            Nombre
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            accessibilityLabelledBy="label-name"
            accessibilityLabel="Nombre"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label} nativeID="label-alias">
            Alias
          </Text>
          <TextInput
            value={alias}
            onChangeText={setAlias}
            placeholder="Cómo quieres que te salude la app"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabelledBy="label-alias"
            accessibilityLabel="Alias"
          />
          <Text style={styles.help}>Se usa en el saludo de Inicio.</Text>
        </View>

        <Button title="Guardar" icon="checkmark" size="lg" onPress={save} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg },
  photoBlock: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  photoActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  field: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 17,
  },
  help: { color: colors.muted, fontSize: 13 },
});
