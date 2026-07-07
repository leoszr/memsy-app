import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { GameButton } from '../../src/components/GameButton';
import { HardShadowBox } from '../../src/components/HardShadowBox';
import { LanguagePairPill } from '../../src/components/LanguagePairPill';
import { PressableWithFeedback } from '../../src/components/PressableWithFeedback';
import { TranslationSwipeCard } from '../../src/components/TranslationSwipeCard';
import { findDuplicateCard } from '../../src/logic';
import { getDefaultTranslationService } from '../../src/services/TranslationService';
import { TranslationResult } from '../../src/services/TranslationService.types';
import { useMemsyStore } from '../../src/store/useMemsyStore';
import { borders, colors, fonts, radii, shadows } from '../../src/theme/tokens';

type PendingTranslation = { word: string; result: TranslationResult };

export default function Add() {
  const router = useRouter();
  const cards = useMemsyStore((state) => state.cards);
  const settings = useMemsyStore((state) => state.settings);
  const addCard = useMemsyStore((state) => state.addCard);
  const [word, setWord] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingTranslation | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pulse = useSharedValue(1);

  const langFrom =
    settings.activeLangFrom ?? settings.activeLearningLanguage ?? 'fr';
  const langTo = settings.activeLangTo ?? settings.nativeLanguage ?? 'pt';

  useEffect(() => {
    if (loading)
      pulse.value = withRepeat(withTiming(0.55, { duration: 450 }), -1, true);
    else pulse.value = withTiming(1, { duration: 120 });
  }, [loading, pulse]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const buttonPulse = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const duplicate = useMemo(
    () => findDuplicateCard(cards, word, langFrom, langTo),
    [cards, langFrom, langTo, word],
  );

  async function translate() {
    const cleanWord = word.trim();
    if (!cleanWord || loading) return;
    const found = findDuplicateCard(cards, cleanWord, langFrom, langTo);
    if (found) {
      setToast('Você já tem esse card!');
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const service = await getDefaultTranslationService();
      const result = await service.translate(cleanWord, langFrom, langTo);
      setPending({ word: cleanWord, result });
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : 'Não consegui traduzir.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function paste() {
    const text = await Clipboard.getStringAsync();
    if (text.trim()) setWord(text.trim());
  }

  async function savePending() {
    if (!pending) return;
    try {
      await addCard({
        word: pending.word,
        translation: pending.result.translation,
        phonetic: pending.result.phonetic,
        gramClass: pending.result.gramClass,
        langFrom,
        langTo,
      });
      setWord('');
      setPending(null);
      setToast('Card salvo! ✦');
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : 'Não consegui salvar o card.',
      );
    }
  }

  function discardPending() {
    setPending(null);
  }

  if (pending) {
    return (
      <View style={[styles.screen, styles.swipeScreen]}>
        <Decorations swipe />
        <TranslationSwipeCard
          word={pending.word}
          langFrom={langFrom}
          result={pending.result}
          onSave={savePending}
          onDiscard={discardPending}
          onError={(error: unknown) =>
            setToast(
              error instanceof Error
                ? error.message
                : 'Não consegui salvar o card.',
            )
          }
        />
        {toast && <Toast message={toast} />}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Decorations />
      <View style={styles.header}>
        <Text style={styles.logo}>memsy</Text>
        <PressableWithFeedback
          accessibilityLabel="Configurações"
          style={styles.settings}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsText}>⚙</Text>
        </PressableWithFeedback>
      </View>
      <LanguagePairPill />
      <Text style={styles.title}>Nova palavra ✦</Text>
      <HardShadowBox
        borderColor={focused ? colors.gameBlue : colors.navyInk}
        radius={radii.md}
        offsetX={4}
        offsetY={4}
      >
        <TextInput
          accessibilityLabel="Palavra para traduzir"
          testID="word-input"
          autoCapitalize="none"
          value={word}
          onChangeText={setWord}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="bonjour..."
          placeholderTextColor={colors.navyInkScrim}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={translate}
        />
      </HardShadowBox>
      <Animated.View style={buttonPulse}>
        <GameButton
          onPress={translate}
          disabled={!word.trim() || loading}
          backgroundColor={colors.gameBlue}
          color={colors.chalkWhite}
          testID="translate-button"
        >
          {loading ? 'TRADUZINDO…' : 'TRADUZIR ✦'}
        </GameButton>
      </Animated.View>
      {duplicate && (
        <DuplicateBanner onView={() => router.push('/(tabs)/cards')} />
      )}
      <View style={styles.tools}>
        <ToolButton
          label="📷 Câmera"
          soon
          onPress={() => setToast('Câmera EM BREVE ✦')}
        />
        <ToolButton
          label="🎤 Voz"
          soon
          onPress={() => setToast('Voz EM BREVE ✦')}
        />
        <ToolButton label="📋 Colar" onPress={paste} />
      </View>
      {toast && <Toast message={toast} />}
    </View>
  );
}

function Decorations({ swipe }: { swipe?: boolean }) {
  return (
    <>
      <View
        importantForAccessibility="no-hide-descendants"
        style={[styles.blobTop, swipe && styles.swipeDotTop]}
      />
      <View
        importantForAccessibility="no-hide-descendants"
        style={[styles.blobBottom, swipe && styles.swipeDotBottom]}
      />
      <Text
        importantForAccessibility="no"
        style={[styles.spark, styles.sparkOne]}
      >
        ✦
      </Text>
      <Text
        importantForAccessibility="no"
        style={[styles.spark, styles.sparkTwo]}
      >
        ✦
      </Text>
    </>
  );
}

function ToolButton({
  label,
  onPress,
  soon,
}: {
  label: string;
  onPress(): void;
  soon?: boolean;
}) {
  return (
    <PressableWithFeedback
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.tool}
    >
      <Text style={styles.toolText}>{label}</Text>
      {soon && <Text style={styles.soon}>EM BREVE</Text>}
    </PressableWithFeedback>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <View style={styles.toast} testID="toast">
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function DuplicateBanner({ onView }: { onView(): void }) {
  return (
    <View style={styles.duplicate}>
      <Text style={styles.duplicateText}>Você já tem esse card!</Text>
      <PressableWithFeedback
        accessibilityLabel="Ver card existente"
        onPress={onView}
      >
        <Text style={styles.duplicateLink}>VER CARD</Text>
      </PressableWithFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 74,
    backgroundColor: colors.chalkWhite,
  },
  swipeScreen: {
    paddingBottom: 106,
    backgroundColor: colors.sky,
  },
  blobTop: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.sky,
    opacity: 0.3,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 40,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.amberBlast,
    opacity: 0.3,
  },
  swipeDotTop: {
    top: 110,
    left: 30,
    right: undefined,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.navyInk,
    backgroundColor: colors.amberBlast,
    opacity: 1,
  },
  swipeDotBottom: {
    bottom: 210,
    left: 46,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.navyInk,
    backgroundColor: colors.bubbleGum,
    opacity: 1,
  },
  spark: { position: 'absolute', fontFamily: fonts.black },
  sparkOne: {
    top: 190,
    left: 24,
    color: colors.coralFire,
    opacity: 0.6,
    transform: [{ rotate: '-14deg' }],
  },
  sparkTwo: {
    top: 420,
    right: 30,
    color: colors.gameBlue,
    opacity: 0.5,
    transform: [{ rotate: '18deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 28,
    transform: [{ rotate: '-1.5deg' }],
  },
  settings: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    backgroundColor: colors.chalkWhite,
    shadowColor: colors.navyInk,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  settingsText: { fontSize: 18 },
  title: {
    marginTop: 34,
    marginBottom: 14,
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 24,
  },
  input: {
    height: 60,
    paddingHorizontal: 18,
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 20,
    backgroundColor: colors.chalkWhite,
  },
  tools: { flexDirection: 'row', gap: 12, marginTop: 18 },
  tool: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: 12,
    backgroundColor: colors.chalkWhite,
    shadowColor: colors.navyInk,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    paddingHorizontal: 4,
  },
  toolText: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 13 },
  soon: {
    marginTop: 2,
    color: colors.lobster,
    fontFamily: fonts.black,
    fontSize: 8,
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 110,
    padding: 14,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.amberBlast,
    shadowColor: colors.navyInk,
    shadowOffset: { width: shadows.hard.x, height: shadows.hard.y },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  toastText: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 14,
    textAlign: 'center',
  },
  duplicate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.mintPop,
  },
  duplicateText: {
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  duplicateLink: {
    color: colors.gameBlue,
    fontFamily: fonts.black,
    fontSize: 12,
  },
});
