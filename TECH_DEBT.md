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
