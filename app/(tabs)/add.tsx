import { StyleSheet, Text, View } from 'react-native';
import { LanguagePairPill } from '../../src/components/LanguagePairPill';
import { colors, fonts } from '../../src/theme/tokens';

export default function Add() {
  return (
    <View style={styles.screen}>
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      <Text style={styles.logo}>memsy</Text>
      <LanguagePairPill />
      <Text style={styles.title}>Nova palavra ✦</Text>
      <Text style={styles.subtitle}>
        Onboarding pronto. Captura vem na próxima sprint.
      </Text>
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
  logo: {
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 28,
    transform: [{ rotate: '-1.5deg' }],
  },
  title: {
    marginTop: 34,
    color: colors.navyInk,
    fontFamily: fonts.black,
    fontSize: 24,
  },
  subtitle: {
    marginTop: 10,
    color: colors.navyInk,
    fontFamily: fonts.bold,
    fontSize: 16,
    opacity: 0.75,
  },
});
