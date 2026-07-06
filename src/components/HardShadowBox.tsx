import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { borders, colors, radii, shadows } from '../theme/tokens';

type Props = {
  children?: ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  radius?: number;
  offsetX?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function HardShadowBox({
  children,
  backgroundColor = colors.chalkWhite,
  borderColor = colors.navyInk,
  radius = radii.lg,
  offsetX = shadows.hard.x,
  offsetY = shadows.hard.y,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <View
        testID="hard-shadow"
        style={[
          styles.shadow,
          {
            borderColor,
            borderRadius: radius,
            left: offsetX,
            top: offsetY,
            right: -offsetX,
            bottom: -offsetY,
          },
        ]}
      />
      <View
        testID="hard-shadow-content"
        style={[
          styles.content,
          { backgroundColor, borderColor, borderRadius: radius },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  shadow: {
    ...StyleSheet.absoluteFill,
    borderWidth: borders.regular,
    backgroundColor: colors.navyInk,
  },
  content: { borderWidth: borders.regular, overflow: 'hidden' },
});
