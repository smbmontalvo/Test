import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View, type AlertButton } from 'react-native';

import { colors, radius, spacing } from '../theme';

type DialogState = { title: string; message?: string; buttons: AlertButton[] };

let show: ((d: DialogState) => void) | null = null;

// Alert.alert does nothing on web, so web gets an in-app dialog with the same API.
export function showAlert(title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  show?.({ title, message, buttons });
}

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    show = setDialog;
    return () => {
      show = null;
    };
  }, []);

  if (!dialog) return null;

  const press = (b: AlertButton) => {
    setDialog(null);
    b.onPress?.();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={() => setDialog(null)}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
          <View style={styles.buttons}>
            {dialog.buttons.map((b, i) => (
              <Pressable
                key={i}
                onPress={() => press(b)}
                style={({ pressed }) => [
                  styles.button,
                  b.style === 'cancel' ? styles.cancel : b.style === 'destructive' ? styles.destructive : styles.primary,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    b.style === 'destructive' && { color: colors.dangerText },
                    (!b.style || b.style === 'default') && { color: colors.accent },
                  ]}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,22,27,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  message: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
  button: { paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  primary: { backgroundColor: colors.accentSoft },
  cancel: { backgroundColor: colors.cardAlt },
  destructive: { backgroundColor: colors.dangerSoft },
  buttonText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
