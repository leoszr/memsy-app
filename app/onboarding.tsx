import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameButton } from '../src/components/GameButton';
import { HardShadowBox } from '../src/components/HardShadowBox';
import { lightHaptic } from '../src/services/haptics';
import { LANGUAGES, Language } from '../src/logic/languages';
import { useMemsyStore } from '../src/store/useMemsyStore';
import { borders, colors, fonts, shadows } from '../src/theme/tokens';

function Dots({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.dots}>
      <View style={[styles.dot, styles.dotFilled]} />
      <View style={[styles.dot, step === 2 && styles.dotAccent]} />
    </View>
  );
}

function Decor({ light = false }: { light?: boolean }) {
  const color = light ? colors.chalkWhite : colors.navyInk;
  return (
    <>
      <Text
        importantForAccessibility="no"
        style={[styles.star, { top: 92, right: 24, color }]}
      >
        ✦
      </Text>
      <Text
        importantForAccessibility="no"
        style={[styles.starSmall, { top: 200, left: 18, color }]}
      >
        ✦
      </Text>
      <Text
        importantForAccessibility="no"
        style={[styles.star, { bottom: 168, right: 40, color }]}
      >
        ✦
      </Text>
      <View
        importantForAccessibility="no-hide-descendants"
        style={[styles.bubble, { top: 130, left: 60, backgroundColor: color }]}
      />
      <View
        importantForAccessibility="no-hide-descendants"
        style={[styles.ring, { bottom: 130, left: -20, borderColor: color }]}
      />
    </>
  );
}

function LanguageCard({
  language,
  selected,
  onPress,
  variant,
}: {
  language: Language;
  selected: boolean;
  onPress: () => void;
  variant: 1 | 2;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {
      damping: 12,
      stiffness: 180,
    });
  }, [progress, selected]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + progress.value * (variant === 1 ? 0.04 : 0.05) },
      { rotate: `${variant === 2 ? -progress.value : 0}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.langWrap, animatedStyle]}>
      <HardShadowBox
        backgroundColor={
          selected && variant === 2 ? colors.amberBlast : colors.chalkWhite
        }
        borderColor={
          selected && variant === 1
            ? colors.gameBlue
            : variant === 2 && !selected
              ? colors.chalkWhite
              : colors.navyInk
        }
        radius={16}
        offsetX={
          selected && variant === 1
            ? shadows.hard.x + 1
            : selected && variant === 2
              ? shadows.hard.x
              : shadows.hard.x - 1
        }
        offsetY={
          selected && variant === 1
            ? shadows.hard.y
            : selected && variant === 2
              ? shadows.hard.y - 1
              : shadows.hard.y - 2
        }
        contentStyle={[
          styles.langShadowContent,
          selected && styles.langShadowContentSelected,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language.name}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={styles.langCard}
        >
          <Text style={styles.flag}>{language.flag}</Text>
          <Text style={styles.langName}>{language.name}</Text>
          <Text
            style={[styles.langCheck, variant === 1 && styles.langCheckBlue]}
          >
            {selected ? '✓' : ''}
          </Text>
        </Pressable>
      </HardShadowBox>
    </Animated.View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const updateSettings = useMemsyStore((s) => s.updateSettings);
  const [step, setStep] = useState<1 | 2>(1);
  const [native, setNative] = useState<string | null>(null);
  const [learning, setLearning] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const learningOptions = useMemo(
    () => LANGUAGES.filter((language) => language.code !== native),
    [native],
  );

  function toggleLearning(code: string) {
    lightHaptic();
    setLearning((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  }

  async function finish() {
    if (!native || learning.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateSettings({
        nativeLanguage: native,
        learningLanguages: JSON.stringify(learning),
        activeLearningLanguage: learning[0] as string,
        activeLangFrom: learning[0] as string,
        activeLangTo: native,
        dailyGoal: '10',
      });
      router.replace('/(tabs)/add');
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Não consegui salvar agora.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <SafeAreaView style={[styles.screen, styles.step1]}>
        <Decor />
        <View style={styles.content}>
          <Text style={styles.logoDark}>Memsy</Text>
          <Dots step={1} />
          <Text style={styles.titleDark}>Qual é a sua língua nativa?</Text>
          <View style={styles.grid}>
            {LANGUAGES.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                selected={native === language.code}
                onPress={() => {
                  lightHaptic();
                  setNative(language.code);
                }}
                variant={1}
              />
            ))}
          </View>
          <GameButton
            disabled={!native}
            onPress={() => setStep(2)}
            style={styles.cta}
          >
            CONTINUAR →
          </GameButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, styles.step2]}>
      <Decor light />
      <View style={styles.content}>
        <Text style={styles.logoLight}>Memsy</Text>
        <Dots step={2} />
        <Text style={styles.titleLight}>O que você quer aprender?</Text>
        <Text style={styles.subtitleLight}>Escolha um ou mais.</Text>
        <View style={styles.grid}>
          {learningOptions.map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              selected={learning.includes(language.code)}
              onPress={() => toggleLearning(language.code)}
              variant={2}
            />
          ))}
        </View>
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        <GameButton
          disabled={learning.length === 0 || saving}
          onPress={finish}
          backgroundColor={colors.amberBlast}
          color={colors.navyInk}
          style={styles.cta}
        >
          {saving ? 'SALVANDO...' : 'COMEÇAR! →'}
        </GameButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  step1: { backgroundColor: colors.amberBlast },
  step2: { backgroundColor: colors.gameBlue },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 30,
  },
  logoDark: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 42,
    lineHeight: 46,
    textAlign: 'center',
    textShadowColor: colors.chalkWhite,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    transform: [{ rotate: '-2deg' }],
  },
  logoLight: {
    color: colors.chalkWhite,
    fontFamily: fonts.black,
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    textShadowColor: colors.navyInk,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    transform: [{ rotate: '-2deg' }],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navyInk,
  },
  dotFilled: { backgroundColor: colors.navyInk },
  dotAccent: { backgroundColor: colors.amberBlast },
  titleDark: {
    marginTop: 24,
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 26,
    lineHeight: 31,
    textAlign: 'center',
  },
  titleLight: {
    marginTop: 22,
    color: colors.chalkWhite,
    fontFamily: fonts.black,
    fontSize: 26,
    lineHeight: 31,
    textAlign: 'center',
  },
  subtitleLight: {
    marginTop: 6,
    color: colors.mintPop,
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  langWrap: { width: '47.5%' },
  langShadowContent: { borderWidth: borders.regular },
  langShadowContentSelected: { borderWidth: 3 },
  langCard: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  flag: { fontSize: 24 },
  langName: {
    flex: 1,
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 15,
  },
  langCheck: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 16 },
  langCheckBlue: { color: colors.gameBlue },
  cta: { marginTop: 'auto' },
  saveError: {
    marginTop: 'auto',
    marginBottom: 12,
    color: colors.chalkWhite,
    fontFamily: fonts.black,
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: colors.navyInk,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  star: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.45,
    transform: [{ rotate: '16deg' }],
  },
  starSmall: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.35,
    transform: [{ rotate: '-12deg' }],
  },
  bubble: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.45,
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderWidth: borders.regular,
    borderRadius: 26,
    opacity: 0.3,
  },
});
