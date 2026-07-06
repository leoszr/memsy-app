import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { HardShadowBox } from './HardShadowBox';
import { colors, fonts } from '../theme/tokens';

type Props = { title: string; subtitle: string; color?: string };

export function SprintZeroScreen({
  title,
  subtitle,
  color = colors.amberBlast,
}: Props) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
  }, [spin]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value * 6 - 3}deg` },
      { scale: 1 + spin.value * 0.04 },
    ],
  }));

  return (
    <View style={[styles.screen, { backgroundColor: color }]}>
      <Animated.View style={animatedStyle}>
        <HardShadowBox contentStyle={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </HardShadowBox>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { padding: 24, minWidth: 260, gap: 8 },
  title: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 30,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.navyInk,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'center',
  },
});
