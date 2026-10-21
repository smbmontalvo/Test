import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CardioWeekSummary } from '../../components/CardioWeekSummary';
import { todayIndex } from '../../components/DayPicker';
import { showAlert } from '../../components/Dialog';
import { FadeInUp, haptic, Pop, PressScale, smoothLayout } from '../../components/motion';
import { Button, Card, EmptyState } from '../../components/ui';
import { CARDIO_ACTIVITIES, getCardioActivity } from '../../data/cardio';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useToday } from '../../hooks/useToday';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { CardioSession, CardioType } from '../../types';
import { cardioSpeed, cardioWeek, formatKm } from '../../utils/cardio';
import { formatRelativeDay, toNumber } from '../../utils/stats';

const QUICK_MINUTES = [15, 30, 45, 60];
const DAY_MS = 24 * 60 * 60 * 1000;

export default function CardioScreen() {
  const inset = useScreenInsets();
  const now = useToday();
  const { cardio, cardioGoal, addCardio, deleteCardio, setCardioGoal } = useGym();

  const [type, setType] = useState<CardioType>('run');
  const [minutes, setMinutes] = useState(30);
  const [distance, setDistance] = useState('');
  const [when, setWhen] = useState<'hoy' | 'ayer'>('hoy');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(t);
  }, [saved]);

  const activity = getCardioActivity(type);
  const week = cardioWeek(cardio, now);

  const save = () => {
    const km = toNumber(distance);
    smoothLayout(320);
    addCardio({
      type,
      minutes,
      date: when === 'hoy' ? Date.now() : Date.now() - DAY_MS,
      distanceKm: activity.tracksDistance && km > 0 ? km : undefined,
    });
    haptic.success();
    setDistance('');
    setSaved(true);
  };

  const confirmDelete = (s: CardioSession) =>
    showAlert('¿Eliminar sesión?', `${getCardioActivity(s.type).name} de ${s.minutes} min, ${formatRelativeDay(s.date, now).toLowerCase()}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          smoothLayout();
          deleteCardio(s.id);
        },
      },
    ]);

  const changeMinutes = (delta: number) => {
    haptic.select();
    setMinutes((m) => Math.min(300, Math.max(5, m + delta)));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
        scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInUp>
          <View style={styles.hero}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="pulse" size={16} color={colors.primaryText} />
              <Text style={styles.eyebrow}>Cardio · esta semana</Text>
            </View>
            <CardioWeekSummary week={week} goal={cardioGoal} today={todayIndex(now)} tone="lime" />
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Meta semanal</Text>
              <Stepper
                label={`${cardioGoal} min`}
                onMinus={() => setCardioGoal(Math.max(30, cardioGoal - 30))}
                onPlus={() => setCardioGoal(Math.min(600, cardioGoal + 30))}
                accessibilityName="meta semanal"
              />
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={90}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Registrar sesión
          </Text>
          <Card style={styles.form}>
            <Text style={styles.label}>Actividad</Text>
            <View style={styles.activities}>
              {CARDIO_ACTIVITIES.map((a) => {
                const active = a.id === type;
                return (
                  <PressScale
                    key={a.id}
                    onPress={() => {
                      haptic.select();
                      setType(a.id);
                    }}
                    pressedScale={0.94}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active, checked: active }}
                    accessibilityLabel={a.name}
                    style={[styles.activity, active && styles.activityActive]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: a.color }]}>
                      <Ionicons name={a.icon} size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.activityText, active && styles.activityTextActive]}>{a.name}</Text>
                  </PressScale>
                );
              })}
            </View>

            <Text style={styles.label}>Duración</Text>
            <View style={styles.durationRow}>
              <RoundButton icon="remove" label="Menos 5 minutos" onPress={() => changeMinutes(-5)} />
              <Text style={styles.duration} accessibilityLabel={`${minutes} minutos`}>
                {minutes}
                <Text style={styles.durationUnit}> min</Text>
              </Text>
              <RoundButton icon="add" label="Más 5 minutos" onPress={() => changeMinutes(5)} />
            </View>
            <View style={styles.quickRow}>
              {QUICK_MINUTES.map((m) => (
                <Choice key={m} label={`${m} min`} active={minutes === m} onPress={() => setMinutes(m)} />
              ))}
            </View>

            {activity.tracksDistance && (
              <>
                <Text style={styles.label} nativeID="label-distance">
                  Distancia <Text style={styles.optional}>(opcional)</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="decimal-pad"
                    placeholder="0,0"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    accessibilityLabel="Distancia en kilómetros"
                    accessibilityLabelledBy="label-distance"
                  />
                  <Text style={styles.inputUnit}>km</Text>
                </View>
              </>
            )}

            <Text style={styles.label}>Cuándo</Text>
            <View style={styles.quickRow}>
              <Choice label="Hoy" active={when === 'hoy'} onPress={() => setWhen('hoy')} />
              <Choice label="Ayer" active={when === 'ayer'} onPress={() => setWhen('ayer')} />
            </View>

            <Button
              title={`Guardar ${activity.name.toLowerCase()} · ${minutes} min`}
              icon="checkmark"
              size="lg"
              onPress={save}
              style={{ marginTop: spacing.sm }}
            />
            {saved && (
              <Pop visible style={styles.savedWrap}>
                <View style={styles.saved} accessibilityLiveRegion="polite">
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  <Text style={styles.savedText}>¡Sesión guardada!</Text>
                </View>
              </Pop>
            )}
          </Card>
        </FadeInUp>

        <FadeInUp delay={180}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Sesiones recientes
          </Text>
          {cardio.length === 0 ? (
            <Card>
              <EmptyState icon="pulse" title="Aún no hay cardio" text="Registra tu primera sesión arriba y verás aquí tu progreso." />
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {cardio.slice(0, 15).map((s, i) => (
                <FadeInUp key={s.id} delay={Math.min(i, 6) * 40}>
                  <SessionRow session={s} now={now} onDelete={() => confirmDelete(s)} />
                </FadeInUp>
              ))}
            </View>
          )}
        </FadeInUp>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SessionRow({ session: s, now, onDelete }: { session: CardioSession; now: number; onDelete: () => void }) {
  const a = getCardioActivity(s.type);
  const speed = cardioSpeed(s);
  const meta = [formatRelativeDay(s.date, now), s.distanceKm ? `${formatKm(s.distanceKm)} km` : null, speed]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.session} accessible accessibilityLabel={`${a.name}, ${s.minutes} minutos. ${meta}`}>
      <View style={[styles.sessionIcon, { backgroundColor: a.color }]}>
        <Ionicons name={a.icon} size={18} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sessionTitle}>
          {a.name} · {s.minutes} min
        </Text>
        <Text style={styles.sessionMeta}>{meta}</Text>
      </View>
      <PressScale
        onPress={onDelete}
        pressedScale={0.85}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar sesión de ${a.name}`}
        style={styles.trash}
      >
        <Ionicons name="trash-outline" size={18} color={colors.muted} />
      </PressScale>
    </View>
  );
}

function RoundButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} pressedScale={0.88} hitSlop={6} accessibilityRole="button" accessibilityLabel={label} style={styles.round}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </PressScale>
  );
}

function Stepper({
  label,
  onMinus,
  onPlus,
  accessibilityName,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
  accessibilityName: string;
}) {
  return (
    <View style={styles.stepper}>
      <PressScale onPress={onMinus} pressedScale={0.85} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Bajar ${accessibilityName}`} style={styles.stepBtn}>
        <Ionicons name="remove" size={16} color={colors.primaryText} />
      </PressScale>
      <Text style={styles.stepValue}>{label}</Text>
      <PressScale onPress={onPlus} pressedScale={0.85} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Subir ${accessibilityName}`} style={styles.stepBtn}>
        <Ionicons name="add" size={16} color={colors.primaryText} />
      </PressScale>
    </View>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressScale
      onPress={onPress}
      pressedScale={0.94}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, checked: active }}
      accessibilityLabel={label}
      style={[styles.choice, active && styles.choiceActive]}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, gap: spacing.md },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: spacing.xl, gap: spacing.md, marginTop: spacing.sm },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { color: colors.primaryText, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(20,22,27,0.2)',
    paddingTop: spacing.md,
  },
  goalLabel: { color: colors.primaryText, fontSize: 15, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { color: colors.primaryText, fontSize: 15, fontWeight: '800', minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.md },
  form: { gap: spacing.md },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optional: { color: colors.muted, fontWeight: '500' },
  activities: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  activityActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  activityIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  activityTextActive: { color: colors.accent, fontWeight: '800' },
  durationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: { color: colors.text, fontSize: 44, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  durationUnit: { color: colors.muted, fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  choiceActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  choiceText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  choiceTextActive: { color: colors.accent, fontWeight: '800' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  input: { flex: 1, minWidth: 0, color: colors.text, fontSize: 18, fontWeight: '700', paddingVertical: 12 },
  inputUnit: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  savedWrap: { alignSelf: 'center' },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savedText: { color: colors.accent, fontSize: 15, fontWeight: '800' },

  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  sessionIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sessionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sessionMeta: { color: colors.muted, fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] },
  trash: { padding: spacing.xs },
});
