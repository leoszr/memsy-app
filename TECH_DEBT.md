# TECH_DEBT.md

## Sprint 4

- Deck usa `FlatList` em vez de `FlashList`.
  - Contexto: evitar adicionar dependência nova durante a sprint; `FlatList` atende o fluxo atual e mantém a suíte estável.
  - Impacto: possível degradação com centenas de cards, critério previsto no Sprint 6.
  - Resolução: testar 500+ cards em dispositivo físico; se houver queda perceptível, instalar `@shopify/flash-list` e trocar a lista do Deck.

- Celebração de conclusão usa confetti textual/leve.
  - Contexto: não há lib de confetti instalada e a prioridade foi completar o loop de treino persistente.
  - Impacto: menor fidelidade visual ao plano para conclusão de sessão.
  - Resolução: no Sprint 6, substituir por animação Reanimated custom ou lib de confetti compatível com Expo SDK 57.
