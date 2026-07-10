import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { colors, radii } from '../theme/tokens';

export function TabBarPill(props: BottomTabBarButtonProps) {
  const focused = props.accessibilityState?.selected ?? false;

  if (focused) {
    return (
      <View style={styles.pillOuter}>
        <View style={styles.pillShadow} />
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={props.accessibilityLabel}
          accessibilityState={{ selected: true }}
          onPress={props.onPress}
          style={styles.pill}
        >
          {props.children}
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={{ selected: false }}
      onPress={props.onPress}
      style={styles.inactive}
    >
      {props.children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pillOuter: {
    marginTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  pillShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 0,
    bottom: Platform.OS === 'ios' ? 22 : 10,
    backgroundColor: colors.navyInk,
    borderRadius: radii.pill,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.amberBlast,
    borderWidth: 2,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
  },
  inactive: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    opacity: 0.6,
  },
});
