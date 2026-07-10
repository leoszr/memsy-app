import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borders, colors, fonts, radii } from '../theme/tokens';

export type ToastAction = {
  label: string;
  onPress(): void;
};

type Props = {
  message: string;
  action?: ToastAction;
  persistent?: boolean;
  onClose(): void;
};

export function GameToast({ message, action, persistent, onClose }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);

  useEffect(() => {
    if (persistent) return;
    const timer = setTimeout(() => onCloseRef.current(), 3500);
    return () => clearTimeout(timer);
  }, [persistent, message]);

  return (
    <View
      style={styles.root}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="toast"
    >
      <View style={styles.shadow} />
      <View style={styles.toast}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          {action && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              hitSlop={10}
            >
              <Text style={styles.action}>{action.label}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            hitSlop={10}
          >
            <Text style={styles.action}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 110,
    zIndex: 10,
  },
  shadow: {
    position: 'absolute',
    left: 5,
    top: 6,
    right: -5,
    bottom: -6,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.navyInk,
  },
  toast: {
    padding: 14,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.amberBlast,
  },
  message: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  action: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
