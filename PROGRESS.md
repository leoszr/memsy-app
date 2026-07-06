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
