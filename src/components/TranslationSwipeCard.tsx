import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { TranslationResult } from '../services/TranslationService.types';
import { borders, colors, fonts, radii } from '../theme/tokens';

type Props = {
  word: string;
  langFrom: string;
  result: TranslationResult;
  onSave(): void | Promise<void>;
  onDiscard(): void | Promise<void>;
};

function lightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

function successHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => undefined,
  );
}

export function TranslationSwipeCard({
  word,
  langFrom,
  result,
  onSave,
  onDiscard,
}: Props) {
  const { width } = useWindowDimensions();
  const threshold = width * 0.4;
  const translateX = useSharedValue(0);
  const popped = useSharedValue(0);
  const crossed = useSharedValue(false);

  useEffect(() => {
    popped.value = withSpring(1, { damping: 10, stiffness: 130 });
  }, [popped]);

  function speak() {
    Speech.speak(word, { language: langFrom });
  }

  function decide(direction: 1 | -1) {
    if (direction > 0) {
      successHaptic();
      void Promise.resolve(onSave()).catch(() => undefined);
    } else {
      lightHaptic();
      void Promise.resolve(onDiscard()).catch(() => undefined);
    }
  }

  const fly = (direction: 1 | -1) => {
    translateX.value = withTiming(
      direction * width * 1.3,
      { duration: 260 },
      () => {
        runOnJS(decide)(direction);
      },
    );
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      const isCrossed = Math.abs(event.translationX) >= threshold;
      if (isCrossed && !crossed.value) runOnJS(lightHaptic)();
      crossed.value = isCrossed;
    })
    .onEnd(() => {
      if (translateX.value > threshold) fly(1);
      else if (translateX.value < -threshold) fly(-1);
      else {
        crossed.value = false;
        translateX.value = withSpring(0, { damping: 10, stiffness: 120 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(popped.value, [0, 1], [0.6, 1]) },
      { translateX: translateX.value },
      {
        rotate: `${interpolate(translateX.value, [-threshold, 0, threshold], [-12, -1.5, 12])}deg`,
      },
    ],
  }));
  const saveOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, threshold * 0.75],
      [0, 1],
      'clamp',
    ),
  }));
  const outOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-threshold * 0.75, 0],
      [1, 0],
      'clamp',
    ),
  }));

  return (
    <View style={styles.root}>
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Descartar card"
          onPress={() => fly(-1)}
        >
          <Text style={[styles.action, styles.outAction]}>✗ FORA</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salvar card"
          onPress={() => fly(1)}
        >
          <Text style={[styles.action, styles.saveAction]}>SALVAR ✓</Text>
        </Pressable>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.card, cardStyle]}
          testID="translation-card"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvir pronúncia"
            onPress={speak}
            style={styles.audio}
          >
            <Text style={styles.audioText}>🔊</Text>
          </Pressable>
          {!!result.gramClass && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{result.gramClass}</Text>
            </View>
          )}
          <Text style={styles.word} adjustsFontSizeToFit numberOfLines={1}>
            {word}
          </Text>
          {!!result.phonetic && (
            <Text style={styles.phonetic}>{result.phonetic}</Text>
          )}
          <View style={styles.divider} />
          <Text style={styles.translation}>{result.translation}</Text>
          <Animated.View
            pointerEvents="none"
            style={[styles.overlay, styles.saveOverlay, saveOverlayStyle]}
          >
            <Text style={styles.overlayText}>SALVO! ✓</Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.overlay, styles.outOverlay, outOverlayStyle]}
          >
            <Text style={styles.overlayText}>FORA ✗</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Text style={styles.hint}>← arraste para decidir →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  action: {
    fontFamily: fonts.black,
    fontSize: 17,
    textShadowColor: colors.chalkWhite,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 0,
  },
  outAction: { color: colors.lobster },
  saveAction: { color: colors.memsyGreen },
  card: {
    flex: 1,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: borders.chunky - 1,
    borderColor: colors.navyInk,
    borderRadius: 24,
    backgroundColor: colors.chalkWhite,
    shadowColor: colors.navyInk,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  audio: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    backgroundColor: colors.mintPop,
  },
  audioText: { fontSize: 18 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    backgroundColor: colors.amberBlast,
  },
  badgeText: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  word: {
    marginTop: 22,
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 52,
    lineHeight: 58,
  },
  phonetic: {
    marginTop: 8,
    color: colors.navyInk,
    fontFamily: fonts.regular,
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.55,
  },
  divider: {
    width: '70%',
    marginVertical: 22,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.navyInk,
  },
  translation: {
    color: colors.memsyGreen,
    fontFamily: fonts.black,
    fontSize: 26,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    top: -3,
    right: -3,
    bottom: -3,
    left: -3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borders.chunky - 1,
    borderColor: colors.navyInk,
    borderRadius: 24,
  },
  saveOverlay: {
    backgroundColor: colors.memsyGreen,
    transform: [{ rotate: '-3deg' }],
  },
  outOverlay: {
    backgroundColor: colors.lobster,
    transform: [{ rotate: '3deg' }],
  },
  overlayText: {
    color: colors.chalkWhite,
    fontFamily: fonts.black,
    fontSize: 38,
    textShadowColor: colors.navyInk,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  hint: {
    marginTop: 14,
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
});
