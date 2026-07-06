import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { LANGUAGES, getLanguage } from '../logic/languages';
import {
  parseLearningLanguages,
  setActiveLearningLanguage,
} from '../logic/onboarding';
import { useMemsyStore } from '../store/useMemsyStore';
import { borders, colors, fonts, radii, shadows } from '../theme/tokens';
import { GameButton } from './GameButton';
import { HardShadowBox } from './HardShadowBox';

export function LanguagePairPill() {
  const [open, setOpen] = useState(false);
  const settings = useMemsyStore((s) => s.settings);
  const updateSettings = useMemsyStore((s) => s.updateSettings);
  const native = getLanguage(settings.nativeLanguage);
  const learningCodes = parseLearningLanguages(settings.learningLanguages);
  const activeCode = settings.activeLearningLanguage ?? learningCodes[0];
  const active = getLanguage(activeCode);

  if (!native || !active) return null;

  const label = `${active.flag} ${active.name} → ${native.flag} ${native.name}`;
  const choices = LANGUAGES.filter((language) =>
    learningCodes.includes(language.code),
  );

  async function choose(code: string) {
    const patch = setActiveLearningLanguage(settings, code);
    if (Object.keys(patch).length > 0) await updateSettings(patch);
    setOpen(false);
  }

  return (
    <>
      <HardShadowBox
        radius={radii.pill}
        backgroundColor={colors.sky}
        offsetX={shadows.hardPressed.x}
        offsetY={shadows.hardPressed.y}
        style={styles.pillWrap}
        contentStyle={styles.pillContent}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => setOpen(true)}
          style={styles.pillPressable}
        >
          <Text style={styles.pillText}>{label}</Text>
        </Pressable>
      </HardShadowBox>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Trocar par ativo</Text>
            {choices.map((language) => (
              <Pressable
                accessibilityRole="button"
                key={language.code}
                onPress={() => choose(language.code)}
                style={[
                  styles.choice,
                  language.code === activeCode && styles.choiceActive,
                ]}
              >
                <Text style={styles.choiceText}>
                  {language.flag} {language.name} → {native.flag} {native.name}
                </Text>
                <Text style={styles.check}>
                  {language.code === activeCode ? '✓' : ''}
                </Text>
              </Pressable>
            ))}
            <GameButton
              onPress={() => setOpen(false)}
              backgroundColor={colors.navyInk}
              color={colors.amberBlast}
            >
              Fechar
            </GameButton>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillWrap: { alignSelf: 'center', marginTop: 22 },
  pillContent: { borderWidth: 2 },
  pillPressable: { paddingVertical: 8, paddingHorizontal: 18 },
  pillText: { color: colors.navyInk, fontFamily: fonts.bold, fontSize: 14 },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.navyInkScrim,
  },
  sheet: {
    gap: 12,
    padding: 24,
    paddingBottom: 34,
    backgroundColor: colors.chalkWhite,
    borderTopWidth: borders.chunky,
    borderColor: colors.navyInk,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  sheetTitle: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 22 },
  choice: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.md,
    backgroundColor: colors.chalkWhite,
  },
  choiceActive: { backgroundColor: colors.amberBlast },
  choiceText: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 15 },
  check: { color: colors.navyInk, fontFamily: fonts.black, fontSize: 18 },
});
