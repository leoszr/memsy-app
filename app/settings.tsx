import { type ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GameButton } from '../src/components/GameButton';
import { HardShadowBox } from '../src/components/HardShadowBox';
import {
  getLanguage,
  parseLearningLanguages,
  setActiveLearningLanguage,
} from '../src/logic';
import { syncDailyReminder } from '../src/services/notifications';
import { getMemsyStore, useMemsyStore } from '../src/store/useMemsyStore';
import { borders, colors, fonts, radii } from '../src/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useMemsyStore((state) => state.settings);
  const cards = useMemsyStore((state) => state.cards);
  const todayStats = useMemsyStore((state) => state.todayStats);
  const updateSettings = useMemsyStore((state) => state.updateSettings);
  const refreshProgress = useMemsyStore((state) => state.refreshProgress);
  const [message, setMessage] = useState<string | null>(null);
  const learning = useMemo(
    () => parseLearningLanguages(settings.learningLanguages),
    [settings.learningLanguages],
  );
  const dailyGoal = Number(settings.dailyGoal ?? 10);
  const notificationHour = Number(settings.notificationHour ?? 19);
  const notificationsOn = settings.notificationsEnabled !== 'false';

  async function saveGoal(goal: number) {
    const nextSettings = { ...settings, dailyGoal: String(goal) };
    await updateSettings({ dailyGoal: String(goal) });
    await refreshProgress();
    const freshStats = getMemsyStore().getState().todayStats;
    await syncDailyReminder(nextSettings, freshStats, cards, updateSettings);
    setMessage(`Meta alterada para ${goal} palavras.`);
  }

  async function saveHour(hour: number) {
    const nextSettings = {
      ...settings,
      notificationHour: String(hour),
      notificationsEnabled: 'true',
    };
    await updateSettings({
      notificationHour: String(hour),
      notificationsEnabled: 'true',
    });
    await syncDailyReminder(nextSettings, todayStats, cards, updateSettings);
    setMessage(`Lembrete marcado para ${hour}h.`);
  }

  async function toggleReminder() {
    const next = notificationsOn ? 'false' : 'true';
    await updateSettings({ notificationsEnabled: next });
    await syncDailyReminder(
      { ...settings, notificationsEnabled: next },
      todayStats,
      cards,
      updateSettings,
    );
    const effective = getMemsyStore().getState().settings.notificationsEnabled;
    setMessage(
      effective !== 'false'
        ? 'Lembrete ativado.'
        : 'Permissão de notificação negada.',
    );
  }

  async function chooseLanguage(code: string) {
    await updateSettings(setActiveLearningLanguage(settings, code));
    setMessage(`${getLanguage(code)?.name ?? code} virou seu idioma ativo.`);
  }

  async function removeLanguage(code: string) {
    if (learning.length <= 1) {
      setMessage('Mantenha pelo menos um idioma para aprender.');
      return;
    }
    const nextLearning = learning.filter((item) => item !== code);
    await updateSettings({
      learningLanguages: JSON.stringify(nextLearning),
      ...(settings.activeLearningLanguage === code
        ? setActiveLearningLanguage(
            { ...settings, learningLanguages: JSON.stringify(nextLearning) },
            nextLearning[0] ?? '',
          )
        : {}),
    });
    setMessage(
      'Idioma removido da lista. Os cards dele ficam ocultos, não deletados.',
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Configurações ⚙</Text>
      </View>

      <Section title="Meta diária">
        <View style={styles.rowWrap}>
          {[5, 10, 20].map((goal) => (
            <Choice
              key={goal}
              active={dailyGoal === goal}
              label={`${goal}`}
              onPress={() => saveGoal(goal)}
            />
          ))}
        </View>
      </Section>

      <Section title="Lembrete diário">
        <GameButton
          backgroundColor={notificationsOn ? colors.memsyGreen : colors.lobster}
          color={colors.chalkWhite}
          onPress={toggleReminder}
        >
          {notificationsOn ? 'LEMBRETE ATIVO' : 'ATIVAR LEMBRETE'}
        </GameButton>
        <View style={styles.rowWrap}>
          {[18, 19, 20, 21].map((hour) => (
            <Choice
              key={hour}
              active={notificationHour === hour}
              label={`${hour}h`}
              onPress={() => saveHour(hour)}
            />
          ))}
        </View>
      </Section>

      <Section title="Idiomas">
        <Text style={styles.help}>
          Remover oculta os cards desse idioma. Nada é apagado.
        </Text>
        {learning.map((code) => {
          const language = getLanguage(code);
          const active = settings.activeLearningLanguage === code;
          return (
            <View key={code} style={styles.languageRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => chooseLanguage(code)}
                style={styles.languageMain}
              >
                <Text style={styles.languageName}>
                  {language?.flag} {language?.name ?? code}
                </Text>
                {active && <Text style={styles.active}>ATIVO</Text>}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover ${language?.name ?? code}`}
                onPress={() => removeLanguage(code)}
              >
                <Text style={styles.remove}>REMOVER</Text>
              </Pressable>
            </View>
          );
        })}
        <Text style={styles.help}>
          Adicionar novos idiomas volta no refinamento pós-beta.
        </Text>
      </Section>

      <Section title="Sobre o Memsy">
        <Text style={styles.about}>
          Local-first, sem conta, sem backend. Suas palavras ficam no SQLite do
          aparelho.
        </Text>
      </Section>

      {message && <Text style={styles.message}>{message}</Text>}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <HardShadowBox
      backgroundColor={colors.chalkWhite}
      contentStyle={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </HardShadowBox>
  );
}

function Choice({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.choice, active && styles.choiceActive]}
    >
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 80,
    backgroundColor: colors.sky,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 36 },
  title: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 32 },
  section: { gap: 12, padding: 18 },
  sectionTitle: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 22,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: {
    minWidth: 66,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.chalkWhite,
  },
  choiceActive: {
    backgroundColor: colors.amberBlast,
    transform: [{ rotate: '-1deg' }],
  },
  choiceText: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 16 },
  help: { color: colors.navyInk, fontFamily: fonts.bold, fontSize: 14 },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.mintPop,
  },
  languageMain: { flex: 1 },
  languageName: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 16,
  },
  active: {
    marginTop: 2,
    color: colors.gameBlue,
    fontFamily: fonts.black,
    fontSize: 11,
  },
  remove: { color: colors.lobster, fontFamily: fonts.black, fontSize: 12 },
  about: {
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  message: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 14,
    textAlign: 'center',
  },
});
