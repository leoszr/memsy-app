import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardShadowBox } from '../../src/components/HardShadowBox';
import { PressableWithFeedback } from '../../src/components/PressableWithFeedback';
import {
  buildWeeklyBars,
  calculateProgressMetrics,
  calculateStreak,
  getLocalDate,
  isStreakAtRisk,
} from '../../src/logic';
import { useMemsyStore } from '../../src/store/useMemsyStore';
import { borders, colors, fonts, radii } from '../../src/theme/tokens';

export default function Progress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cards = useMemsyStore((state) => state.cards);
  const settings = useMemsyStore((state) => state.settings);
  const todayStats = useMemsyStore((state) => state.todayStats);
  const dailyStats = useMemsyStore((state) => state.dailyStats);
  const resultCounts = useMemsyStore((state) => state.resultCounts);
  const hydrated = useMemsyStore((state) => state.hydrated);
  const refreshProgress = useMemsyStore((state) => state.refreshProgress);
  const today = getLocalDate();
  const dailyGoal = Number(settings.dailyGoal ?? 10);

  useEffect(() => {
    if (hydrated) refreshProgress();
  }, [hydrated, refreshProgress]);

  const metrics = useMemo(
    () => calculateProgressMetrics(cards, resultCounts, todayStats),
    [cards, resultCounts, todayStats],
  );
  const weeklyBars = useMemo(
    () => buildWeeklyBars(dailyStats, today),
    [dailyStats, today],
  );
  const streak = calculateStreak(dailyStats, today);
  const risk = isStreakAtRisk(dailyStats, new Date());
  const goalProgress = Math.min(100, (metrics.trainedToday / dailyGoal) * 100);
  const maxBar = Math.max(1, ...weeklyBars.map((bar) => bar.cardsTrained));

  return (
    <ScrollView
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 14 }]}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        style={styles.decorOne}
      />
      <View
        importantForAccessibility="no-hide-descendants"
        style={styles.decorTwo}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PROGRESSO 📊</Text>
        </View>
        <HardShadowBox
          backgroundColor={colors.chalkWhite}
          radius={radii.pill}
          offsetX={2}
          offsetY={2}
        >
          <PressableWithFeedback
            accessibilityLabel="Abrir configurações"
            style={styles.settings}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsText}>⚙</Text>
          </PressableWithFeedback>
        </HardShadowBox>
      </View>

      <View
        accessible
        accessibilityLabel={`Streak de ${streak} dias ${risk ? 'em risco' : 'seguidos'}`}
      >
        <HardShadowBox
          backgroundColor={risk ? colors.lobster : colors.amberBlast}
          offsetX={6}
          offsetY={6}
          contentStyle={styles.streakCard}
        >
          <Text style={styles.fire}>🔥</Text>
          <View style={styles.streakCopy}>
            <Text
              style={styles.streakNumber}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              numberOfLines={1}
            >
              {streak}
            </Text>
            <Text style={styles.streakLabel}>
              {risk ? 'Streak em risco!' : 'dias seguidos'}
            </Text>
          </View>
        </HardShadowBox>
      </View>

      <View style={styles.goalWrap}>
        <View style={styles.goalHead}>
          <Text style={styles.goalLabel}>Meta diária</Text>
          <Text style={styles.goalValue}>
            {metrics.trainedToday} / {dailyGoal} hoje
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: dailyGoal,
            now: metrics.trainedToday,
          }}
          accessibilityLabel={`Meta diária: ${metrics.trainedToday} de ${dailyGoal} palavras treinadas hoje`}
          style={styles.goalBar}
        >
          <View style={[styles.goalFill, { width: `${goalProgress}%` }]} />
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Metric
          label="Acertos"
          value={`${metrics.accuracy}%`}
          color={colors.mintPop}
        />
        <Metric
          label="Salvos"
          value={String(metrics.savedCards)}
          color={colors.sky}
        />
        <Metric
          label="Dominadas"
          value={String(metrics.masteredCards)}
          color={colors.amberBlast}
        />
        <Metric
          label="Hoje"
          value={String(metrics.trainedToday)}
          color={colors.bubbleGum}
        />
      </View>

      <HardShadowBox
        backgroundColor={colors.chalkWhite}
        contentStyle={styles.weekCard}
      >
        <Text style={styles.weekTitle}>Últimos 7 dias</Text>
        <View style={styles.chart}>
          {weeklyBars.map((bar) => (
            <View
              key={bar.date}
              style={styles.barColumn}
              accessible
              accessibilityLabel={`${bar.label}${bar.isToday ? ', hoje' : ''}, ${bar.cardsTrained} cards`}
            >
              <View
                style={[
                  styles.weekBar,
                  {
                    height: Math.max(6, (bar.cardsTrained / maxBar) * 92),
                    backgroundColor: bar.isToday
                      ? colors.gameBlue
                      : colors.amberBlast,
                  },
                ]}
              />
              <Text style={styles.barValue}>{bar.cardsTrained}</Text>
              <Text style={styles.barLabel}>{bar.label}</Text>
              {bar.isToday && <Text style={styles.todayMarker}>hoje</Text>}
            </View>
          ))}
        </View>
      </HardShadowBox>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
      style={styles.metricBox}
    >
      <HardShadowBox
        backgroundColor={color}
        offsetX={4}
        offsetY={4}
        contentStyle={styles.metric}
      >
        <Text
          style={styles.metricValue}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </HardShadowBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 18,
    paddingHorizontal: 22,
    paddingBottom: 120,
    backgroundColor: colors.coralFire,
  },
  decorOne: {
    position: 'absolute',
    top: 130,
    right: -80,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.bubbleGum,
    opacity: 0.35,
  },
  decorTwo: {
    position: 'absolute',
    bottom: 80,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.amberBlast,
    opacity: 0.28,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  title: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 26,
    lineHeight: 30,
    flexShrink: 1,
  },
  settings: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: { fontSize: 20 },
  streakCard: {
    minHeight: 134,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 22,
    transform: [{ rotate: '-1.2deg' }],
  },
  fire: { fontSize: 58 },
  streakCopy: { alignItems: 'flex-start' },
  streakNumber: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 58,
    lineHeight: 60,
  },
  streakLabel: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 17 },
  goalWrap: {
    padding: 14,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.lg,
    backgroundColor: colors.chalkWhite,
  },
  goalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalLabel: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 16 },
  goalValue: { color: colors.navyInk, fontFamily: fonts.bold, fontSize: 15 },
  goalBar: {
    height: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    backgroundColor: colors.sky,
  },
  goalFill: { height: '100%', backgroundColor: colors.memsyGreen },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricBox: { width: '47%' },
  metric: { minHeight: 104, justifyContent: 'center', padding: 14 },
  metricValue: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 34,
  },
  metricLabel: {
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 14,
    flexShrink: 1,
  },
  weekCard: { padding: 18, gap: 14 },
  weekTitle: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 22 },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: { alignItems: 'center', gap: 4 },
  weekBar: {
    width: 28,
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: 8,
  },
  barValue: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 12 },
  barLabel: { color: colors.navyInk, fontFamily: fonts.bold, fontSize: 11 },
  todayMarker: {
    color: colors.gameBlue,
    fontFamily: fonts.black,
    fontSize: 9,
    marginTop: 1,
  },
});
