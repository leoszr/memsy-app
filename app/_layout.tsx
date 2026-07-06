import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GameButton } from '../src/components/GameButton';
import { bootstrapMemsyStore } from '../src/store/appStore';
import { colors, fonts } from '../src/theme/tokens';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

type BootState = 'booting' | 'ready' | 'error';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_900Black,
  });
  const ready = loaded || !!error;
  const [bootState, setBootState] = useState<BootState>('booting');
  const [bootError, setBootError] = useState<string | null>(null);

  function handleBootError(err: unknown) {
    setBootError(err instanceof Error ? err.message : 'Falha ao iniciar.');
    setBootState('error');
  }

  function retryBoot() {
    setBootState('booting');
    setBootError(null);
    bootstrapMemsyStore()
      .then((store) => store.getState().hydrate())
      .then(() => setBootState('ready'))
      .catch(handleBootError);
  }

  useEffect(() => {
    bootstrapMemsyStore()
      .then((store) => store.getState().hydrate())
      .then(() => setBootState('ready'))
      .catch(handleBootError);
  }, []);

  useEffect(() => {
    if (ready && bootState !== 'booting') {
      SplashScreen.hideAsync();
    }
  }, [ready, bootState]);

  if (!ready) return null;
  if (bootState === 'booting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navyInk} />
      </View>
    );
  }
  if (bootState === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Ops, não consegui abrir o Memsy.</Text>
        <Text style={styles.errorText}>{bootError}</Text>
        <GameButton onPress={retryBoot}>Tentar de novo</GameButton>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.chalkWhite,
  },
  errorTitle: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 22,
    textAlign: 'center',
  },
  errorText: {
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: 'center',
  },
});
