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
