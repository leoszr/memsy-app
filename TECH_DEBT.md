# TECH_DEBT.md

## Sprint 4

- Deck usa `FlatList` em vez de `FlashList`.
  - Contexto: evitar adicionar dependência nova durante a sprint; `FlatList` atende o fluxo atual e mantém a suíte estável.
  - Impacto: possível degradação com centenas de cards, critério previsto no Sprint 6.
  - Resolução: testar 500+ cards em dispositivo físico; se houver queda perceptível, instalar `@shopify/flash-list` e trocar a lista do Deck.

- Celebração de conclusão usa confetti textual/leve.
  - Contexto: não há lib de confetti instalada e a prioridade foi completar o loop de treino persistente.
  - Impacto: menor fidelidade visual ao plano para conclusão de sessão.
  - Resolução: no Sprint 6, substituir por animação Reanimated custom ou lib de confetti compatível com Expo SDK 54.

## Sprint 5

- Celebração de novo recorde de streak ainda não dispara uma única vez por recorde.
  - Contexto: o streak continua corretamente recalculado dos dados-fonte; falta uma marca persistida como `bestStreakCelebrated` para controlar apenas a celebração visual.
  - Impacto: CA S5.2 parcialmente visual, sem afetar métrica nem persistência.
  - Resolução: no Sprint 6, adicionar lógica pura para detectar recorde, salvar apenas o recorde celebrado em `settings` e tocar haptic/animação.

- Adicionar novos idiomas pela tela Configurações ficou limitado.
  - Contexto: a tela permite trocar/remover idiomas e explica que cards removidos ficam ocultos; adicionar novo idioma exige validar pares ativos e ajustar onboarding/settings sem quebrar cards existentes.
  - Impacto: usuário não consegue ampliar lista de idiomas sem refazer onboarding manualmente.
  - Resolução: adicionar seletor de idiomas no Sprint 6 ou pós-beta, usando `parseLearningLanguages` e `setActiveLearningLanguage`.

## Sprint 6

- Ícone do app é placeholder padrão do Expo.
  - Contexto: `assets/icon.png` (1024×1024) é o ícone default do Expo; o plano exige design customizado estilo card com borda/sombra dura e letra M.
  - Impacto: identidade visual do app incompleta; não afeta funcionalidade.
  - Resolução: gerar ícone customizado com ferramenta de design (Figma/Illustrator) e substituir `assets/icon.png`, `splash-icon.png`, favicon e Android adaptive.

- Build EAS, TestFlight e Sentry não configurados.
  - Contexto: Sprint 6.5 requer `eas build`, distribuição via TestFlight e crash reporting com Sentry. São dependências de contas externas (Apple Developer, Sentry) e device físico para validação.
  - Impacto: app não distribuível fora do Expo Go.
  - Resolução: configurar EAS Build, gerar build iOS, instalar via TestFlight em ≥2 dispositivos, integrar Sentry com sourcemaps.

- Validação de acessibilidade e contraste pendente.
  - Contexto: contraste WCAG AA nos 6 fundos coloridos e fluxo VoiceOver (swipe alternativo por botão) precisam ser validados em device real.
  - Impacto: conformidade de acessibilidade não verificada.
  - Resolução: auditar cores com ferramenta de contraste, testar VoiceOver em iOS, ajustar tons se necessário.

- Beta com usuários reais não iniciado.
  - Contexto: Sprint 6.6 exige ≥3 pessoas usando o app por ≥3 dias com feedback estruturado.
  - Impacto: bugs de UX e usabilidade podem passar despercebidos.
  - Resolução: distribuir build via TestFlight, coletar feedback com formulário curto, corrigir bugs críticos antes do release.
