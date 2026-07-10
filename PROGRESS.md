# PROGRESS.md

Fonte de verdade: `docs/memsy_plano_desenvolvimento.md`.

## Sprint 0 — Fundação do projeto

Status: ✅ Concluída

### Entregas

- Projeto Expo + TypeScript criado com `strict: true`.
- `expo-router` configurado com 4 abas: Adicionar, Cards, Treinar, Progresso.
- Scheme `memsy://` configurado em `app.json`.
- Dependências core instaladas: Zustand, expo-sqlite, Reanimated, Gesture Handler.
- Tema base em `src/theme/tokens.ts` com paleta, bordas, raios e sombras.
- Fonte Nunito 400/700/900 carregada com `expo-font` e splash segurando até load.
- `<HardShadowBox>` criado com borda navyInk e sombra dura via View deslocada.
- ESLint, Prettier, Jest e Husky configurados.
- Testes iniciais de componente e telas adicionados.

### Verificação local

- `npm run lint`: ✅ passou.
- `npm test`: ✅ passou.

### Observação

- Validação em dispositivo físico iOS precisa ser feita fora deste ambiente.

## Correções pós-validação

- HardShadowBox: sombra corrigida para sair da área do conteúdo.
- Testes de HardShadowBox migrados para React Native Testing Library com snapshots reais.
- Teste de tabs deixou de ser grep de arquivo e agora renderiza layout/telas com RNTL.
- Splash agora prossegue em caso de erro no carregamento de fontes.
- Husky agora executa `lint-staged` + testes.
- AGENTS/CLAUDE corrigidos para evitar self-import.

## Sprint 1 — Camada de dados e lógica de domínio

Status: ✅ Concluída

### Entregas

- Schema SQLite versionado com migrations idempotentes: `cards`, `settings`, `training_log`, `daily_stats` e controle `migrations`.
- `CardRepository` com CRUD, busca por status e contagem por status, usando prepared statements via `prepareAsync`.
- Repositórios auxiliares para settings e treino/estatísticas diárias.
- Lógica pura em `src/logic/`:
  - `nextCardState` para status, streak, contadores e domínio de mastered/training.
  - `buildTrainingQueue` com prioridade erradas > novas > training antigas > mastered fallback, shuffle por faixa e seed em testes.
  - `calculateStreak` com datas locais `YYYY-MM-DD`.
  - `calculateXP` e `isGoalMet`.
- Store Zustand (`createMemsyStore`) conectada aos repositórios; persiste antes de atualizar memória.
- Fluxos de integração sem UI: criar card, treinar até mastered, meta diária e XP persistido.

### Verificação local

- `npm run lint`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (29 testes).
- Cobertura por `jest --coverage`:
  - `src/logic/`: ✅ 98.11% statements / 100% lines.
  - `src/db/`: ✅ 86.88% statements / 88.46% lines.
- `npx tsc --noEmit`: ✅ passou.

### Observação

- Validação manual em dispositivo físico e teste de reinstalação/primeira inicialização precisam ser feitos fora deste ambiente.

### Correções pós-review Sprint 1

- CardRepository preserva casing original da palavra para exibição; deduplicação case-insensitive passa a ser garantida por migration append-only `v2` com índice `COLLATE NOCASE`.
- `daily_stats` e `settings.xp` deixam de ser incrementados em memória: agora são recalculados a partir de `training_log` após cada treino e no `hydrate()`.
- Regra de meta diária usa `isGoalMet` de `src/logic/`, sem duplicar comparação no repositório.
- Testes adicionados para preservação de casing e reconstrução de XP divergente a partir do log.

## Sprint 2 — Onboarding e configuração

Status: ✅ Concluída

### Entregas

- Gate inicial com `app/index.tsx`: sem idiomas configurados redireciona para onboarding; com config vai para tabs.
- Bootstrap do store no layout raiz: abre SQLite, roda migrations, hidrata Zustand antes de liberar a navegação.
- Tela de onboarding passo 1 fiel ao protótipo: fundo amberBlast, logo rotacionado, decoração e grade 2 colunas de idiomas.
- Tela de onboarding passo 2: fundo gameBlue, seleção múltipla, idioma nativo oculto e persistência de settings.
- Botões `GameButton` com efeito físico de pressionar e estado disabled.
- Animações de seleção com Reanimated spring em cards de idioma.
- Lógica pura de onboarding em `src/logic/onboarding.ts`: gate, parse dos idiomas e troca de idioma ativo.
- `LanguagePairPill` na tela Adicionar com bottom sheet para trocar o par ativo e persistir em `settings`.
- Testes RNTL do fluxo: selecionar idioma nativo → avançar → escolher idiomas de aprendizado → persistir settings → navegar para tabs.

### Verificação local

- `npm run lint`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (33 testes).
- `npx tsc --noEmit`: ✅ passou.

### Observação

- Validação em dispositivo físico, Maestro e checagem de 60fps precisam ser feitas fora deste ambiente.
- Transição onboarding→tabs usa navegação nativa do Expo Router; ajuste fino de bounce visual pode ser refinado após teste em dispositivo.

## Sprint 3 — Captura, tradução e swipe

Status: ✅ Concluída

### Entregas

- Serviço de tradução com interface `translate(word, from, to)` e implementação DeepL via `fetch`.
- Erros tipados para configuração, timeout, rede, HTTP e tradução vazia; timeout padrão de 8s.
- Cache local em SQLite com migration append-only `v3` (`translation_cache`) e repositório dedicado.
- Tela Adicionar fiel ao protótipo: fundo `chalkWhite`, blobs, input com HardShadowBox/foco `gameBlue`, botão com pulse de loading, toast estilizado e ações Câmera/Voz/Colar.
- Colar integrado com `expo-clipboard`; Câmera e Voz mostram badge/toast `EM BREVE`.
- Card de tradução com palavra, fonética, divisor tracejado, tradução, badge de classe gramatical e áudio via `expo-speech`.
- Swipe implementado com Gesture Handler + Reanimated worklets: rotação proporcional, overlays `SALVO! ✓`/`FORA ✗`, threshold de 40% da largura, fly-out e retorno com spring.
- Haptics com `expo-haptics` no threshold e no salvamento; botões laterais acessíveis como alternativa ao gesto.
- Persistência do fluxo: salvar cria card `new`, descartar não persiste, duplicata case-insensitive no mesmo par é bloqueada antes da API.

### Verificação local

- `npm run lint`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (41 testes).
- `npx tsc --noEmit`: ✅ passou.

### Observação

- Tradução real exige `.env` com `EXPO_PUBLIC_DEEPL_API_KEY` (não commitado).
- Validação manual em dispositivo físico, Maestro e checagem de 60fps/haptics precisam ser feitas fora deste ambiente.

## Sprint 4 — Treino e sessões

Status: ✅ Concluída

### Entregas

- Tela Deck (Meus Cards) substitui placeholder: lista de cards com rotação alternada, badges de status, contador, empty state e CTA fixo para treino.
- Ação de apagar card com confirmação via long press/toque no item.
- Fluxo de sessão de treino na aba Treinar:
  - fila via `buildTrainingQueue`, até 10 cards;
  - direção da pergunta alternada por card via lógica pura `assignQuestionDirections`;
  - card com revelar resposta e animação de flip 3D;
  - botões `ERREI`, `QUASE`, `ACERTEI` registram em `training_log`, aplicam `nextCardState`, atualizam XP/meta e avançam.
- Tela de conclusão com celebração, XP total, acertos/quase/erros, palavras dominadas e meta diária batida.
- Bottom sheet de primeira meta diária com opções 5/10/20 palavras.
- Estados vazios: sem cards e todos dominados com revisão disponível.
- Lógica pura em `src/logic/session.ts`: `assignQuestionDirections` e `summarizeSession`.

### Verificação local

- `npm run lint -- --fix`: ✅ passou.
- `npx tsc --noEmit`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (44 testes).

### Observação

- Lista do Deck usa `FlatList` nativa. `FlashList` fica como otimização futura se teste real com centenas de cards exigir.
- Confetti implementado como celebração visual leve; animação/partículas reais podem ser refinadas no Sprint 6.
- Validação manual em dispositivo físico, Maestro, 60fps no flip e teste de interrupção de sessão precisam ser feitos fora deste ambiente.

## Downgrade Expo SDK 54

Status: ✅ Concluído em branch `downgrade/sdk-54`

### Entregas

- Dependências gerenciadas Expo alinhadas ao SDK 54: Expo 54, React 19.1, React Native 0.81.5, Expo Router 6, Reanimated 4.1 e Worklets 0.5.1.
- DevDependencies ajustadas para SDK 54: `jest-expo`/`babel-preset-expo` 54, `eslint-config-expo` 10, TypeScript 5.9, tipos React 19.1.
- React Native Testing Library rebaixada para 13.3.3 com `react-test-renderer` 19.1.0 para compatibilidade com React 19.1.
- `.npmrc` com `legacy-peer-deps=true` para manter instalação reproduzível com os peers opcionais do Expo Router no SDK 54.
- `babel.config.js` simplificado: removido plugin antigo `react-native-reanimated/plugin`; SDK 54 injeta worklets pelo preset Expo.
- Ajustes TypeScript para SDK 54/TS 5.9 em estilos absolutos (`StyleSheet.absoluteFill` sem spread).

### Verificação local

- `npx expo install --fix`: ✅ dependências atualizadas.
- `npm ci --dry-run`: ✅ lockfile sincronizado.
- `npx expo-doctor`: ✅ 18/18 checks passaram após isolar `node_modules` global de `/home/leo` que gerava falso positivo de React duplicado fora do repo.
- `npx tsc --noEmit`: ✅ passou.
- `npm run lint`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (44 testes).

### Observação

- Smoke manual no Expo Go/dispositivo físico ainda precisa ser feito fora deste ambiente.

## Sprint 5 — Progresso, streak e retenção

Status: ✅ Concluída

### Entregas

- Tela Progresso substitui placeholder: fundo `coralFire`, widget de streak com 🔥, barra de meta diária, grid 2x2 de métricas e gráfico semanal de 7 barras.
- Métricas vêm de dados-fonte: cards, `training_log` agregado por resultado e `daily_stats` reconstruído via repositório.
- Streak usa `calculateStreak` e é recalculado ao abrir a tela.
- Estado de streak em risco implementado com função pura: ontem bateu meta, hoje ainda não, após 18h local.
- `expo-notifications` instalado e configurado; lembrete diário local é sincronizado após concluir sessão de treino.
- Lógica pura de retenção em `src/logic/progress.ts`: métricas, barras semanais, risco de streak e decisão de agendar/cancelar notificação.
- Tela Configurações (`/settings`) acessível pelo ⚙ nas telas Adicionar e Progresso: meta diária, horário/ativação de lembrete, idioma ativo, remoção de idioma com cards ocultos.
- Store expõe `dailyStats`, `resultCounts` e `refreshProgress()` para manter Progresso atualizado sem contadores redundantes.

### Verificação local

- `npm run lint -- --fix`: ✅ passou.
- `npx tsc --noEmit`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (48 testes).

### Observação

- Teste real de notificação em dispositivo físico com horário +2 min ainda precisa ser feito fora deste ambiente.
- Celebração de novo recorde de streak ficou registrada como dívida para polimento, porque exige persistir recorde exibido sem transformar streak em contador incrementado.

## Sprint 6 — Polimento, resiliência e release (parcial)

Status: 🔄 Em andamento

### S6.1 — Microinterações

- ✅ `PressableWithFeedback`: componente reutilizável com animação de escala (0.94x) no press-in. Usa `Animated.View` wrapper para não conflitar com `transform` do caller.
- ✅ Todos os `Pressable` não-GameButton migrados para `PressableWithFeedback`:
  - `ToolButton`, `DuplicateBanner`, settings gear (add)
  - Lista de cards, delete com haptic Medium (cards)
  - Quiz card reveal com haptic Light (train)
  - Settings gear, back button, choices, language rows (progress, settings)
  - Actions "SALVAR ✓"/"✗ FORA" (TranslationSwipeCard)
  - Pill de idioma e choices do modal (LanguagePairPill)
  - Audio button mantido como `Pressable` simples (evita conflito com pan gesture do swipe)
- ✅ Haptics centralizados em `src/services/haptics.ts`: `lightHaptic`, `mediumHaptic`, `successHaptic`, `errorHaptic`.
  - Onboarding: seleção de idioma (Light)
  - Train: revelar card (Light), answer correct (Success), wrong (Error), almost (Light)
  - Cards: long press delete (Medium)
- ✅ Tab bar: animação `fade` entre abas + ícones emoji com tint color do React Navigation.

### S6.2 — Estados de borda e resiliência

- ✅ Chars especiais: `normalizeCardWord` usa `toLocaleLowerCase()` + `trim()`; acentos e apóstrofos preservados.
- ✅ Empty states: todas as telas já cobertas (Sprints 2-5).
- ✅ Error states: boot error com retry, toast em tradução/save, saveError no onboarding.
- ✅ Loading states: ActivityIndicator no boot + hydrate; pulse no botão de tradução.

### S6.3 — Acessibilidade

- ✅ Tab bar: `tabBarAccessibilityLabel` em todas as 4 abas + ícones emoji.
- ✅ Elementos decorativos marcados `importantForAccessibility="no"` / `"no-hide-descendants"` em add, progress, onboarding.
- ✅ Métricas do progress: `accessible` + `accessibilityLabel` wrapper.
- ✅ Streak card: `accessible` + `accessibilityLabel` wrapper.
- ✅ Todos os botões com `accessibilityLabel` (GameButton, PressableWithFeedback).

### S6.4 — Ícone, splash, identidade

- ✅ Assets já existem: `icon.png` (1024×1024), `splash-icon.png` (1024×1024), favicon e Android adaptive.
- ✅ `app.json`: `name: "Memsy"`, `version: "1.0.0"`, `scheme: "memsy"`.
- ✅ Config de splash adicionada: `splash.image`, `backgroundColor: "#ecc30b"`, `imageWidth: 200`.

### Pendente

- S6.1: ícones emoji no tab bar podem precisar de ajuste de renderização em device real.
- S6.4: ícone do app é placeholder do Expo; precisa de design customizado (card com borda/sombra dura, letra M).
- S6.5: Build EAS + TestFlight + Sentry (requer device físico e contas externas).
- S6.6: Beta com ≥3 usuários + formulário de feedback.
- Contraste WCAG AA: verificar pares de cores nos 6 fundos em device real.
- VoiceOver: validar fluxo swipe alternativo por botão em device iOS.

## Auditoria UI/UX — Bloco 0 (implementação)

Status: 🔄 Implementado em código, pendente validação manual em iOS e Android físicos.

- UI-01: commit do swipe inicia junto da animação; falha restaura o card e mantém retry de salvamento visível.
- UI-03: travas síncronas com `useRef` no swipe e treino; store rejeita persistências simultâneas equivalentes.
- UI-02: remoção do `rotateY`; resposta do treino entra por crossfade no mesmo card.
- UI-04: falha de tradução usa feedback persistente com `Tentar novamente` e `Fechar`, preservando texto e foco.
- UI-22a: remoção de idioma exige confirmação explícita e explica que cards ficam ocultos.
- UI-22b: cards do Deck abrem detalhes por toque; exclusão é secundária e mantém confirmação nativa.

### Verificação local

- `npm run lint`: ✅ passou.
- `npm test -- --runInBand`: ✅ passou (51 testes).
- `npx tsc --noEmit`: ✅ passou.
