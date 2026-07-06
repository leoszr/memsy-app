import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GameButton } from '../../src/components/GameButton';
import { HardShadowBox } from '../../src/components/HardShadowBox';
import {
  assignQuestionDirections,
  buildTrainingQueue,
  nextCardState,
  summarizeSession,
} from '../../src/logic';
import { Card, TrainingResult } from '../../src/logic/types';
import { useMemsyStore } from '../../src/store/useMemsyStore';
import { borders, colors, fonts, radii } from '../../src/theme/tokens';

type AnswerLog = {
  card: Card;
  result: TrainingResult;
  becameMastered: boolean;
};
const resultColors: Record<TrainingResult, string> = {
  wrong: colors.lobster,
  almost: colors.amberBlast,
  correct: colors.memsyGreen,
};

export default function Train() {
  const router = useRouter();
  const cards = useMemsyStore((state) => state.cards);
  const settings = useMemsyStore((state) => state.settings);
  const todayStats = useMemsyStore((state) => state.todayStats);
  const recordTrainingResult = useMemsyStore(
    (state) => state.recordTrainingResult,
  );
  const updateSettings = useMemsyStore((state) => state.updateSettings);
  const [queue, setQueue] = useState<Card[]>([]);
  const [directions, setDirections] = useState<
    Record<string, 'front-to-back' | 'back-to-front'>
  >({});
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [finished, setFinished] = useState(false);
  const [goalSheet, setGoalSheet] = useState(
    !settings.dailyGoal && cards.length > 0,
  );
  const flip = useSharedValue(0);

  const availableQueue = useMemo(() => buildTrainingQueue(cards, 10), [cards]);
  const current = queue[index];
  const direction = current
    ? (directions[current.id] ?? 'front-to-back')
    : 'front-to-back';
  const sessionXP = summarizeSession(answers).totalXP;
  const total = queue.length;
  const progress = total ? (index / total) * 100 : 0;
  const allMastered =
    cards.length > 0 && cards.every((c) => c.status === 'mastered');

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${flip.value * 180}deg` },
      { scale: revealed ? 1.02 : 1 },
    ],
  }));

  function startSession(includeMastered = true) {
    const next = includeMastered
      ? buildTrainingQueue(cards, 10)
      : buildTrainingQueue(
          cards.filter((c) => c.status !== 'mastered'),
          10,
        );
    setQueue(next);
    setDirections(assignQuestionDirections(next));
    setIndex(0);
    setAnswers([]);
    setFinished(false);
    setRevealed(false);
    flip.value = 0;
  }

  function reveal() {
    setRevealed(true);
    flip.value = withSpring(1, { damping: 14, stiffness: 120 });
  }

  async function answer(result: TrainingResult) {
    if (!current) return;
    const before = current.status;
    const predicted = nextCardState(current, result);
    await recordTrainingResult(current.id, result);
    setAnswers((prev) => [
      ...prev,
      {
        card: current,
        result,
        becameMastered:
          before !== 'mastered' && predicted.status === 'mastered',
      },
    ]);
    const nextIndex = index + 1;
    if (nextIndex >= total) setFinished(true);
    else {
      setIndex(nextIndex);
      setRevealed(false);
      flip.value = withSpring(0, { damping: 14, stiffness: 120 });
    }
  }

  async function chooseGoal(goal: number) {
    await updateSettings({ dailyGoal: String(goal) });
    setGoalSheet(false);
  }

  if (finished)
    return (
      <Completion
        answers={answers}
        todayGoalMet={!!todayStats?.goalMet}
        onMore={() => startSession(true)}
        onProgress={() => router.push('/(tabs)/progress')}
      />
    );

  if (cards.length === 0) {
    return (
      <View style={styles.screen}>
        <Empty
          title="Sem cards ainda ✦"
          text="Adicione palavras para liberar o treino."
          action="ADICIONAR"
          onPress={() => router.push('/(tabs)/add')}
        />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TREINO</Text>
          <Text style={styles.title}>
            {allMastered ? 'Tudo dominado! 🏆' : 'Pronto para jogar?'}
          </Text>
          <Text style={styles.subtitle}>
            {allMastered
              ? 'Revise dominadas para manter a memória forte.'
              : `${availableQueue.length} cards na fila de hoje.`}
          </Text>
        </View>
        <HardShadowBox
          backgroundColor={colors.chalkWhite}
          contentStyle={styles.startCard}
        >
          <Text style={styles.bigEmoji}>{allMastered ? '🏆' : '⚡'}</Text>
          <Text style={styles.startText}>
            Sessões curtas de até 10 cards. Errou? Volta primeiro.
          </Text>
        </HardShadowBox>
        <GameButton
          backgroundColor={colors.navyInk}
          color={colors.amberBlast}
          onPress={() => startSession(true)}
        >
          COMEÇAR TREINO →
        </GameButton>
        {goalSheet && <GoalSheet onChoose={chooseGoal} />}
      </View>
    );
  }

  const prompt =
    direction === 'front-to-back' ? current.word : current.translation;
  const answerText =
    direction === 'front-to-back' ? current.translation : current.word;

  return (
    <View style={styles.screen}>
      <View style={styles.trainingHeader}>
        <Text style={styles.progressText}>
          {index + 1} / {total}
        </Text>
        <Text style={styles.xpText}>+{sessionXP} XP</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Revelar resposta"
        onPress={reveal}
      >
        <Animated.View style={[styles.flipWrap, cardStyle]}>
          <HardShadowBox
            backgroundColor={colors.chalkWhite}
            offsetX={6}
            offsetY={6}
            contentStyle={styles.quizCard}
          >
            <Text style={styles.quizHint}>
              {revealed ? 'RESPOSTA' : 'TOQUE PARA VIRAR'}
            </Text>
            <Text style={styles.quizWord}>
              {revealed ? answerText : prompt}
            </Text>
            <Text style={styles.quizSub}>
              {direction === 'front-to-back'
                ? 'palavra → tradução'
                : 'tradução → palavra'}
            </Text>
          </HardShadowBox>
        </Animated.View>
      </Pressable>
      {revealed ? (
        <View style={styles.answers}>
          <AnswerButton label="ERREI" result="wrong" onPress={answer} />
          <AnswerButton label="QUASE" result="almost" onPress={answer} />
          <AnswerButton label="ACERTEI" result="correct" onPress={answer} />
        </View>
      ) : (
        <GameButton
          backgroundColor={colors.gameBlue}
          color={colors.chalkWhite}
          onPress={reveal}
        >
          REVELAR ✦
        </GameButton>
      )}
      {goalSheet && <GoalSheet onChoose={chooseGoal} />}
    </View>
  );
}

function AnswerButton({
  label,
  result,
  onPress,
}: {
  label: string;
  result: TrainingResult;
  onPress(result: TrainingResult): void;
}) {
  return (
    <GameButton
      backgroundColor={resultColors[result]}
      color={colors.chalkWhite}
      style={styles.answerButton}
      textStyle={styles.answerText}
      onPress={() => onPress(result)}
    >
      {label}
    </GameButton>
  );
}

function Completion({
  answers,
  todayGoalMet,
  onMore,
  onProgress,
}: {
  answers: AnswerLog[];
  todayGoalMet: boolean;
  onMore(): void;
  onProgress(): void;
}) {
  const summary = summarizeSession(answers);
  return (
    <View style={styles.screen}>
      <Text style={styles.confetti}>✦ 🎉 ✦</Text>
      <Text style={styles.title}>Sessão completa!</Text>
      <HardShadowBox
        backgroundColor={colors.amberBlast}
        contentStyle={styles.finishCard}
      >
        <Text style={styles.finishXP}>{summary.totalXP} XP</Text>
        <Text style={styles.finishText}>
          {summary.correct} acertos · {summary.almost} quase · {summary.wrong}{' '}
          erros
        </Text>
        {summary.masteredWords.length > 0 && (
          <Text style={styles.mastered}>
            🏆 Você dominou: {summary.masteredWords.join(', ')}!
          </Text>
        )}
        {todayGoalMet && (
          <Text style={styles.mastered}>🔥 Meta diária batida!</Text>
        )}
      </HardShadowBox>
      <GameButton
        backgroundColor={colors.navyInk}
        color={colors.amberBlast}
        onPress={onMore}
      >
        TREINAR MAIS
      </GameButton>
      <GameButton
        backgroundColor={colors.gameBlue}
        color={colors.chalkWhite}
        onPress={onProgress}
      >
        VER PROGRESSO
      </GameButton>
    </View>
  );
}

function Empty({
  title,
  text,
  action,
  onPress,
}: {
  title: string;
  text: string;
  action: string;
  onPress(): void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.bigEmoji}>✨</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{text}</Text>
      <GameButton
        backgroundColor={colors.gameBlue}
        color={colors.chalkWhite}
        onPress={onPress}
      >
        {action}
      </GameButton>
    </View>
  );
}

function GoalSheet({ onChoose }: { onChoose(goal: number): void }) {
  return (
    <View style={styles.sheetBackdrop}>
      <HardShadowBox
        backgroundColor={colors.chalkWhite}
        contentStyle={styles.sheet}
      >
        <Text style={styles.sheetTitle}>Meta diária?</Text>
        <Text style={styles.sheetText}>
          Escolha quantas palavras quer treinar por dia.
        </Text>
        {[5, 10, 20].map((goal) => (
          <GameButton
            key={goal}
            backgroundColor={colors.amberBlast}
            color={colors.navyInk}
            onPress={() => onChoose(goal)}
          >
            {goal} PALAVRAS
          </GameButton>
        ))}
      </HardShadowBox>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.mintPop,
    paddingTop: 68,
    paddingHorizontal: 22,
    gap: 18,
  },
  header: { gap: 4 },
  eyebrow: { fontFamily: fonts.black, color: colors.navyInk, letterSpacing: 2 },
  title: { fontFamily: fonts.black, color: colors.navyInk, fontSize: 34 },
  subtitle: { fontFamily: fonts.bold, color: colors.navyInk, fontSize: 17 },
  startCard: { padding: 22, alignItems: 'center', gap: 8 },
  startText: {
    fontFamily: fonts.bold,
    color: colors.navyInk,
    fontSize: 18,
    textAlign: 'center',
  },
  bigEmoji: { fontSize: 62, textAlign: 'center' },
  empty: { flex: 1, justifyContent: 'center', gap: 14, paddingBottom: 80 },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 24,
  },
  xpText: { fontFamily: fonts.black, color: colors.memsyGreen, fontSize: 22 },
  bar: {
    height: 18,
    borderWidth: borders.regular,
    borderColor: colors.navyInk,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.chalkWhite,
  },
  barFill: { height: '100%', backgroundColor: colors.gameBlue },
  flipWrap: {
    marginTop: 40,
    marginBottom: 22,
    transform: [{ rotate: '-1.5deg' }],
  },
  quizCard: {
    minHeight: 310,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  quizHint: {
    fontFamily: fonts.black,
    color: colors.coralFire,
    letterSpacing: 1.4,
  },
  quizWord: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 42,
    textAlign: 'center',
  },
  quizSub: { fontFamily: fonts.bold, color: colors.navyInkScrim },
  answers: { gap: 12 },
  answerButton: { minHeight: 54 },
  answerText: { fontSize: 16 },
  confetti: { fontSize: 42, textAlign: 'center', marginTop: 50 },
  finishCard: { padding: 22, gap: 10, alignItems: 'center' },
  finishXP: { fontFamily: fonts.black, color: colors.navyInk, fontSize: 52 },
  finishText: {
    fontFamily: fonts.bold,
    color: colors.navyInk,
    fontSize: 17,
    textAlign: 'center',
  },
  mastered: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    textAlign: 'center',
    fontSize: 18,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    padding: 22,
    justifyContent: 'center',
    backgroundColor: colors.navyInkOverlay,
  },
  sheet: { padding: 20, gap: 12 },
  sheetTitle: {
    fontFamily: fonts.black,
    color: colors.navyInk,
    fontSize: 28,
    textAlign: 'center',
  },
  sheetText: {
    fontFamily: fonts.bold,
    color: colors.navyInk,
    textAlign: 'center',
  },
});
