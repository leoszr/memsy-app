# Task list — auditoria UI/UX

Fonte: `docs/AUDITORIA_UI_UX.md` (09/07/2026). Plano e protótipo continuam canônicos.

## Regras de execução

- [ ] Não fechar item de UI sem `npm run lint`, `npm test` e `npx tsc --noEmit`.
- [ ] Toda animação nova deve respeitar Reduce Motion.
- [ ] Usar somente tokens e sombra dura via `HardShadowBox`/camada deslocada.
- [ ] Validar em iOS e Android físicos antes de marcar itens de gesto, haptic, layout ou acessibilidade como concluídos.

## Bloco 0 — impedir perda de fluxo e duplicação (P0/P1)

- [ ] **UI-01 — Recuperar falha ao salvar swipe.** Fazer `savePending` propagar resultado/erro; travar decisões durante o commit; iniciar persistência junto da animação; em falha, retornar o card com spring, manter `pending` visível e mostrar toast com **Tentar salvar novamente**. Cobrir falha de SQLite e garantir que a aba Adicionar não fica presa vazia.
- [ ] **UI-03 — Tornar salvar e responder idempotentes.** Criar travas síncronas com `useRef` em swipe e treino; desabilitar affordances durante animação/operação; proteger também a action da store contra duplicação. Testar dois toques no mesmo frame.
- [ ] **UI-02 — Corrigir revelação do treino.** Remover o `rotateY` atual e revelar a resposta no card com crossfade curto, sem spoiler antes do fim da animação. Não implementar o flip de duas faces: diverge do protótipo e é menos robusto no Android.
- [ ] **UI-04 — Adicionar retry de tradução.** Exibir toast persistente, acionável e em linguagem de usuário, com **Tentar novamente** e **Fechar**; preservar texto e foco do input.
- [ ] **UI-22a — Confirmar remoção de idioma.** Antes de remover, explicar que os cards ficam ocultos, não apagados, e exigir confirmação explícita.
- [ ] **UI-22b — Corrigir exclusão no Deck.** Preservar confirmação já existente; substituir o gesto/long press ambíguo por abertura de detalhes, com exclusão secundária e confirmação. Não reutilizar swipe-to-delete, pois swipe já significa salvar/descartar na captura.

## Bloco 1 — acessibilidade e feedback (P1)

- [ ] **UI-05 — Criar `GameToast` acessível.** Centralizar toasts com posição visível, ação opcional, `accessibilityRole="alert"` e `accessibilityLiveRegion="polite"`; chamar `AccessibilityInfo.announceForAccessibility` no iOS. Aplicar também aos feedbacks de Configurações.
- [ ] **UI-11 — Corrigir contraste WCAG AA.** Criar tokens de texto secundário acessível e eliminar opacidade usada como cor de texto. Usar `navyInk` sobre `amberBlast`, `memsyGreen`, `lobster` e `coralFire`; revisar fonética, scrims, badges, placeholders e estados disabled. Registrar a divergência necessária do protótipo para os botões de resposta.
- [ ] **UI-12 — Garantir alvos de toque.** Aplicar mínimo 44×44 pt, `hitSlop` sem sobreposição e gap de 8 pt em ações do swipe, pill de idiomas, Ver card, Remover e voltar. Tornar linhas inteiras acionáveis quando aplicável.
- [ ] **UI-13a — Completar acessibilidade do seletor de idiomas.** Manter `Modal` nativo; adicionar label/role ao scrim, foco inicial e retorno do foco após fechar.
- [ ] **UI-13b — Corrigir `GoalSheet`.** Migrar a view absoluta para `Modal` acessível; isolar conteúdo de fundo, incluir backdrop e botão Fechar, foco inicial e retorno de foco. Não obrigar seleção de 5/10/20 para sair.
- [ ] **UI-14 — Respeitar Reduce Motion.** Usar `ReduceMotion.System`/preferência do sistema em pop, crossfade do treino, pulse, escala, fade e swipe. Trocar pulse infinito por estado estático quando ativo.
- [ ] **UI-15 — Dar semântica ao progresso.** Expor meta como `progressbar` com `accessibilityValue`; dar label completo a cada barra semanal (dia, hoje quando aplicável, quantidade) e distinguir hoje também por texto/marker.
- [ ] **UI-16 — Corrigir semântica dos cards do Deck.** Label deve informar palavra, tradução, status e sequência; exclusão deve ser uma ação acessível separada, nunca a descrição principal do card.

## Bloco 2 — responsividade e conteúdo (P1/P2)

- [ ] **UI-07 — Adaptar telas críticas.** Em Adicionar, Deck, Treino e Configurações usar `useSafeAreaInsets()` e padding derivado; adicionar `ScrollView`/`KeyboardAvoidingView` onde necessário; remover alturas mínimas rígidas e adaptar com `useWindowDimensions`. No onboarding, manter `SafeAreaView` existente e tornar o grid rolável.
- [ ] **UI-08 — Não alterar coluna de respostas.** Manter botões verticais, como no protótipo. Antes de revelar, mantê-los no layout com `opacity: 0.35` e `pointerEvents="none"`; usar ícones e cor canônicos, com QUASE em `coralFire` + `navyInk`.
- [ ] **UI-09 — Tratar textos longos.** Definir `minimumFontScale`, `numberOfLines`, estratégia de quebra/expansão e `flexShrink: 1` em palavras, traduções, badges e headers. Testar alemão longo, frases, fonética extensa, emoji, cirílico e RTL em 200%.
- [ ] **UI-10 — Corrigir layout de `PressableWithFeedback`.** Colapsar para um único `AnimatedPressable`, combinando `style` e estilo animado no mesmo nó. Validar rows, ferramentas e seletor de idioma em layouts flex.
- [ ] **UI-06 — Alinhar indicador de sessão.** Fazer barra e texto usarem a mesma semântica: posição `(index + 1) / total` ou conclusão com rótulo explícito “0 concluídos”.

## Bloco 3 — fidelidade ao protótipo e consistência (P1/P2)

- [ ] **UI-17 — Implementar tab bar canônica.** Criar item ativo em pill `amberBlast`, borda `navyInk`, sombra dura, labels consistentes e ícones vetoriais consistentes; testar iOS e Android.
- [ ] **UI-18 — Corrigir fundos das telas.** Deck em `bubbleGum`; Treino em `memsyGreen`; revisar contraste após a troca.
- [ ] **UI-19 — Remover sombras nativas divergentes.** Substituir `shadow*`/`elevation` em settings, ferramentas, toast, progresso e card de tradução por sombra dura estrutural. Confirmar renderização Android.
- [ ] **UI-20 — Padronizar feedback de pressão.** Trocar escala de `0.94` por pressão física (translate 3 px + remoção de sombra) ou escala sutil `0.96`, por categoria; alinhar com `GameButton`.
- [ ] **UI-21 — Remover eyebrows redundantes.** Remover em Deck, Treino e Progresso, seguindo o protótipo; manter somente quando trouxer contexto novo.

## Bloco 4 — copy e fluxos secundários (P2/P3)

- [ ] **UI-23 — Corrigir feedback de lembrete.** Diferenciar “Lembrete desativado”, “Lembrete ativado” e “Permissão negada”; tratar falha assíncrona com recuperação.
- [ ] **UI-24 — Remover copy interna de roadmap.** Implementar adicionar idioma ou ocultar o controle/texto. Se permanecer indisponível, usar copy de usuário e canal de feedback, sem mencionar beta/sprint.
- [ ] **UI-25 — Dar contexto ao duplicado.** Passar `cardId` ao Deck, rolar até o card e destacá-lo; alternativa aceitável: sheet de detalhes do card.
- [ ] **UI-26 — Rebaixar ações indisponíveis.** Desabilitar semanticamente Câmera/Voz ou remover até funcionarem; manter Colar como principal; eliminar badge de 8 px.

## Backlog de produto pós-correções

- [ ] Deck: busca, filtros por idioma/status e ordenação (erradas, novas, último treino).
- [ ] Detalhe do card: pronúncia, histórico, edição, iniciar treino e exclusão secundária.
- [ ] Ensino de swipe no primeiro card: animação curta, feedback no threshold e alternativas por botão claras.
- [ ] Progresso: restaurar CTA **Treinar agora** e mensagem acionável baseada na meta.
- [ ] Conclusão: celebração breve com haptic, ligada a marcos reais e compatível com Reduce Motion.
- [ ] Streak/meta: copy de recuperação sem culpa e CTA direto.
- [ ] Configurações: gerenciamento completo de idiomas; feedback próximo do controle; estado de permissão de notificações.
- [ ] Expandir `tokens.ts`: tipografia, spacing, touch target, texto secundário acessível, focus, disabled, loading e error.
- [ ] Substituir emojis de navegação/controles por ícones vetoriais consistentes.
- [ ] Criar ícone/splash Memsy final (card, borda navy, sombra dura e “M”).

## Validação de release

- [ ] Testar 320×568, 375×667, 393×852, Android compacto, tablet, portrait e landscape.
- [ ] Testar fonte do sistema em 100%, 150% e 200%.
- [ ] Validar VoiceOver/TalkBack: onboarding, captura, swipe alternativo, treino, gráfico e modais.
- [ ] Validar Reduce Motion ativo e contraste AA de todos os estados de texto.
- [ ] Abrir teclado em Adicionar: CTA, erro e toast continuam acessíveis.
- [ ] Simular timeout/rede/SQLite: retry não perde conteúdo nem bloqueia fluxo.
- [ ] Executar toques rápidos repetidos: sem card/treino duplicado.
- [ ] Testar Deck com 0, 1, 100 e 500+ cards.
- [ ] Comparar safe areas, sombras, tab bar e ícones em iOS/Android físicos contra o protótipo.
