import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getInitialRoute } from '../src/logic';
import { useMemsyStore } from '../src/store/useMemsyStore';
import { colors } from '../src/theme/tokens';

export default function Index() {
  const hydrated = useMemsyStore((s) => s.hydrated);
  const settings = useMemsyStore((s) => s.settings);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.navyInk} />
      </View>
    );
  }

  return (
    <Redirect
      href={
        getInitialRoute(settings) === 'onboarding'
          ? '/onboarding'
          : '/(tabs)/add'
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chalkWhite,
  },
});
