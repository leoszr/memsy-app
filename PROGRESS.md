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
