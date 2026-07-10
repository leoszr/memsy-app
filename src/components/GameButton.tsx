import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { borders, colors, fonts, radii, shadows } from '../theme/tokens';

type Props = {
  children: ReactNode;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameButton({
  children,
  onPress,
  disabled,
  backgroundColor = colors.navyInk,
  color = colors.amberBlast,
  style,
  textStyle,
  testID,
}: Props) {
  const pressed = useSharedValue(0);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * shadows.hardPressed.x },
      { translateY: pressed.value * shadows.hardPressed.y },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 1 - pressed.value }));

  return (
    <View style={[styles.root, style]}>
      <Animated.View style={[styles.shadow, shadowStyle]} />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={typeof children === 'string' ? children : undefined}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, {
            duration: 80,
            reduceMotion: ReduceMotion.System,
          });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, {
            duration: 110,
            reduceMotion: ReduceMotion.System,
          });
        }}
        testID={testID}
        style={[
          styles.button,
          { backgroundColor, opacity: disabled ? 0.4 : 1 },
          buttonStyle,
        ]}
      >
        <Text style={[styles.label, { color }, textStyle]}>{children}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', minHeight: 60 },
  shadow: {
    position: 'absolute',
    left: shadows.hard.x - 1,
    top: shadows.hard.y - 2,
    right: -(shadows.hard.x - 1),
    bottom: -(shadows.hard.y - 2),
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.navyInk,
  },
  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
  },
  label: {
    fontFamily: fonts.black,
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
