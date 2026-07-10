import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityRole?: 'button' | 'none';
  accessibilityLabel?: string;
  accessibilityState?: Record<string, unknown>;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableWithFeedback({
  children,
  onPress,
  onLongPress,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  style,
  disabled,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, {
          duration: 80,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 120,
          reduceMotion: ReduceMotion.System,
        });
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
