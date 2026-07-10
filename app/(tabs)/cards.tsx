import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameButton } from '../../src/components/GameButton';
import { mediumHaptic } from '../../src/services/haptics';
import { HardShadowBox } from '../../src/components/HardShadowBox';
import { PressableWithFeedback } from '../../src/components/PressableWithFeedback';
import { Card, CardStatus } from '../../src/logic/types';
import { useMemsyStore } from '../../src/store/useMemsyStore';
import { borders, colors, fonts, radii } from '../../src/theme/tokens';

const statusLabel: Record<CardStatus, string> = {
  new: 'NOVA',
  training: 'EM TREINO',
  mastered: 'DOMINADA',
};
const statusColor: Record<CardStatus, string> = {
  new: colors.amberBlast,
  training: colors.sky,
  mastered: colors.mintPop,
};

export default function Cards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cards = useMemsyStore((state) => state.cards);
  const discardCard = useMemsyStore((state) => state.discardCard);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const counts = useMemo(
    () => ({
      total: cards.length,
      mastered: cards.filter((c) => c.status === 'mastered').length,
    }),
    [cards],
  );

  async function remove(card: Card) {
    const run = async () => discardCard(card.id);
    if (typeof Alert.alert === 'function') {
      Alert.alert('Apagar card?', `"${card.word}" sai do deck.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'APAGAR', style: 'destructive', onPress: run },
      ]);
    } else await run();
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DECK</Text>
        <Text style={styles.title} numberOfLines={2}>
          Meus Cards ✦
        </Text>
        <Text style={styles.count}>
          {counts.total} salvos · {counts.mastered} dominados
        </Text>
      </View>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>Adicione sua primeira palavra!</Text>
          <Text style={styles.emptyText}>
            Capture, traduza e salve cards para treinar aqui.
          </Text>
          <GameButton
            backgroundColor={colors.gameBlue}
            color={colors.chalkWhite}
            onPress={() => router.push('/(tabs)/add')}
          >
            ADICIONAR ✦
          </GameButton>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <PressableWithFeedback
              accessibilityLabel={`${item.word}, tradução ${item.translation}, status ${statusLabel[item.status]}, ${item.correctStreak} de 3 acertos seguidos. Toque para abrir detalhes`}
              onPress={() =>
                setPendingDelete(pendingDelete === item.id ? null : item.id)
              }
            >
              <HardShadowBox
                backgroundColor={colors.chalkWhite}
                radius={radii.lg}
                offsetX={5}
                offsetY={6}
                style={[
                  styles.cardWrap,
                  {
                    transform: [
                      { rotate: index % 2 === 0 ? '-1.5deg' : '1.5deg' },
                    ],
                  },
                ]}
                contentStyle={styles.card}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text
                      style={styles.word}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                      numberOfLines={2}
                    >
                      {item.word}
                    </Text>
                    <Text style={styles.translation} numberOfLines={2}>
                      {item.translation}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statusColor[item.status] },
                    ]}
                  >
                    <Text
                      style={styles.badgeText}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      numberOfLines={1}
                    >
                      {statusLabel[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.timesTrained} treinos · streak {item.correctStreak}/3
                </Text>
                {pendingDelete === item.id && (
                  <View style={styles.details}>
                    <Text style={styles.detailsText}>
                      {item.correctStreak}/3 acertos seguidos
                    </Text>
                    <PressableWithFeedback
                      accessibilityLabel={`Apagar ${item.word}`}
                      onPress={() => {
                        mediumHaptic();
                        void remove(item);
                      }}
                    >
                      <Text style={styles.deleteLink}>APAGAR CARD</Text>
                    </PressableWithFeedback>
                  </View>
                )}
              </HardShadowBox>
            </PressableWithFeedback>
          )}
        />
      )}
      {cards.length > 0 && (
        <View style={styles.cta}>
          <GameButton
            backgroundColor={colors.navyInk}
            color={colors.amberBlast}
            onPress={() => router.push('/(tabs)/train')}
          >
            TREINAR AGORA →
          </GameButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sky,
    paddingHorizontal: 20,
  },
  header: { marginBottom: 14 },
  eyebrow: { fontFamily: fonts.black, color: colors.navyInk, letterSpacing: 2 },
  title: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 34,
    flexShrink: 1,
  },
  count: {
    fontFamily: fonts.bold,
    color: colors.navyInk,
    fontSize: 16,
    flexShrink: 1,
  },
  list: { paddingBottom: 124, gap: 16, paddingTop: 8 },
  cardWrap: { marginBottom: 16 },
  card: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  word: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 27,
    flexShrink: 1,
  },
  translation: {
    fontFamily: fonts.bold,
    color: colors.memsyGreen,
    fontSize: 18,
    marginTop: 2,
    flexShrink: 1,
  },
  meta: { marginTop: 12, fontFamily: fonts.bold, color: colors.navyInkMuted },
  badge: {
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 11,
  },
  details: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: borders.hairline,
    borderColor: colors.navyInk,
    gap: 10,
  },
  detailsText: { color: colors.navyInk, fontFamily: fonts.bold, fontSize: 14 },
  deleteLink: { color: colors.lobster, fontFamily: fonts.black, fontSize: 13 },
  cta: { position: 'absolute', left: 20, right: 20, bottom: 96 },
  empty: { flex: 1, justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyIcon: { fontSize: 54, textAlign: 'center' },
  emptyTitle: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 28,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.bold,
    color: colors.navyInk,
    textAlign: 'center',
    marginBottom: 10,
  },
});
