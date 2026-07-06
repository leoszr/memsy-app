# Memsy — Plano de Desenvolvimento v1

**Stack**: Expo + React Native · TypeScript · expo-router · Zustand · expo-sqlite · Reanimated 3 + Gesture Handler · API de tradução (DeepL ou Google Translate)
**Arquitetura**: local-first, sem backend. Dados persistidos em SQLite no dispositivo.
**Duração estimada**: 6 sprints de 1 semana (ajustável conforme dedicação).

---

## Convenções do plano

- **Task atômica**: unidade de trabalho que cabe em no máximo 1 dia e resulta em algo verificável.
- **CA** = Critério de Aceite. A task só está pronta quando todos os CAs passam.
- **TU** = Teste Unitário (Jest). Escrito junto com a task, não depois.
- **TI** = Teste de Integração do sprint (Jest + React Native Testing Library, ou Maestro para fluxos E2E).
- **DoD do sprint** = Definition of Done — critérios finais para fechar o sprint.

---

# Sprint 0 — Fundação do projeto

**Objetivo**: projeto configurado, rodando no dispositivo, com qualidade de código garantida por tooling.

### Tasks

**S0.1 — Criar projeto Expo com TypeScript**

- CA1: `npx create-expo-app` com template TypeScript executado; app abre no Expo Go em iOS.
- CA2: `tsconfig.json` com `strict: true`.
- CA3: estrutura de pastas criada: `app/` (rotas), `src/components/`, `src/store/`, `src/db/`, `src/services/`, `src/logic/`, `src/theme/`.

**S0.2 — Configurar expo-router com tab bar**

- CA1: navegação por abas funciona com 4 abas vazias: Adicionar, Cards, Treinar, Progresso.
- CA2: deep linking básico configurado (scheme `memsy://`).

**S0.3 — Instalar e validar dependências core**

- CA1: `zustand`, `expo-sqlite`, `react-native-reanimated`, `react-native-gesture-handler` instalados e o app compila.
- CA2: um componente de teste com Reanimated (box animada) roda a 60fps no dispositivo físico.

**S0.4 — Configurar tema do design system**

- CA1: arquivo `src/theme/tokens.ts` exporta todas as cores da paleta (gameBlue #067bc2, sky #84bcda, amberBlast #ecc30b, coralFire #f37748, lobster #d56062, memsyGreen #05a77d, navyInk #1a1a2e, chalkWhite #fffdf5, bubbleGum #ffb3c6, mintPop #b8f0e0), raios de borda, espessuras de borda e offsets de sombra.
- CA2: fonte Nunito (400/700/900) carregada via `expo-font` com splash screen segurando até o load.
- CA3: componente `<HardShadowBox>` reutilizável implementado (borda 2.5px navyInk + sombra dura via View deslocada, já que RN não tem box-shadow offset sólido nativo).

**S0.5 — Configurar tooling de qualidade**

- CA1: ESLint + Prettier configurados; `npm run lint` passa sem erros.
- CA2: Jest configurado com `jest-expo`; um teste dummy passa via `npm test`.
- CA3: Husky com pre-commit rodando lint + testes.

### Testes unitários

- TU S0.4: snapshot test do `<HardShadowBox>` renderizando com props padrão e customizadas.

### Testes de integração do sprint

- TI-0.1: app inicializa, tab bar renderiza as 4 abas, navegação entre abas funciona (React Native Testing Library).

### DoD Sprint 0

- [ ] App roda no dispositivo físico iOS via Expo Go sem warnings críticos.
- [ ] Todas as 4 abas navegáveis.
- [ ] Fonte Nunito visível em texto de teste.
- [ ] `npm run lint` e `npm test` passam.
- [ ] `<HardShadowBox>` valida o visual do design system em dispositivo real.

---

# Sprint 1 — Camada de dados e lógica de domínio

**Objetivo**: toda a lógica de negócio implementada e testada, sem UI. Este é o sprint com maior densidade de testes unitários — é o coração do app.

### Tasks

**S1.1 — Schema SQLite e migrations**

- CA1: tabelas criadas via migration versionada:
  - `cards` (id, word, translation, phonetic, gram_class, lang_from, lang_to, status ['new'|'training'|'mastered'], correct_streak, times_trained, times_correct, times_wrong, created_at, last_trained_at)
  - `settings` (key, value) — para idioma nativo, idiomas aprendendo, meta diária
  - `training_log` (id, card_id, result ['wrong'|'almost'|'correct'], trained_at)
  - `daily_stats` (date, cards_trained, cards_correct, goal_met)
- CA2: sistema de migration roda na inicialização e é idempotente (rodar 2x não quebra).

**S1.2 — Repositório de cards (CardRepository)**

- CA1: métodos implementados: `create`, `getById`, `getAll`, `getByStatus`, `update`, `delete`, `countByStatus`.
- CA2: todas as queries usam prepared statements (proteção contra injection).
- CA3: repositório é a única camada que toca SQLite — nenhum componente importa `expo-sqlite` diretamente.

**S1.3 — Lógica de status do card (regra de "dominada")**

- CA1: função pura `nextCardState(card, result)` implementada em `src/logic/`:
  - resultado `correct` → incrementa `correct_streak`; ao atingir 3 seguidos → status vira `mastered`.
  - resultado `almost` → `correct_streak` mantém (não zera, não incrementa).
  - resultado `wrong` → `correct_streak` zera; se estava `mastered`, volta para `training`.
  - card `new` treinado pela primeira vez → vira `training`.
- CA2: a função é pura (sem side effects, sem acesso a banco) — recebe card, retorna card novo.

**S1.4 — Fila de treino priorizada**

- CA1: função pura `buildTrainingQueue(cards, sessionSize)` implementada:
  - prioridade 1: cards com `times_wrong > 0` e status `training` (erradas primeiro).
  - prioridade 2: cards `new` (nunca treinadas).
  - prioridade 3: cards `training` restantes, ordenadas por `last_trained_at` mais antigo.
  - cards `mastered` só entram se a fila não completar o `sessionSize`.
- CA2: a fila embaralha dentro de cada faixa de prioridade (não fica previsível).
- CA3: retorna no máximo `sessionSize` cards (default 10).

**S1.5 — Lógica de streak (dias seguidos)**

- CA1: função pura `calculateStreak(dailyStats, today)` implementada:
  - streak conta dias consecutivos com `goal_met = true` terminando hoje ou ontem.
  - se ontem não bateu a meta e hoje ainda não, streak = 0.
  - se ontem bateu e hoje ainda não, streak se mantém (dia atual em aberto).
- CA2: lida com timezones via data local do dispositivo (formato YYYY-MM-DD).

**S1.6 — Lógica de XP e meta diária**

- CA1: função pura `calculateXP(result)`: correct = 10 XP, almost = 5 XP, wrong = 1 XP.
- CA2: função pura `isGoalMet(cardsTrainedToday, dailyGoal)` retorna boolean.
- CA3: XP acumulado persiste em `settings`.

**S1.7 — Store Zustand conectada ao repositório**

- CA1: store expõe: `cards`, `settings`, `todayStats`, e actions `addCard`, `saveCard`, `discardCard`, `recordTrainingResult`, `updateSettings`.
- CA2: toda action que muda dado persiste no SQLite antes de atualizar o estado em memória.
- CA3: `hydrate()` carrega o estado do banco na inicialização do app.

### Testes unitários

- TU S1.1: migrations rodam em banco em memória; rodar 2x não duplica tabelas.
- TU S1.2: CRUD completo do CardRepository em banco em memória (criar, ler, atualizar status, deletar, contar por status).
- TU S1.3: **suíte crítica** — todos os caminhos de `nextCardState`: new→training, 3 acertos→mastered, wrong zera streak, mastered+wrong→training, almost não altera streak. Mínimo 8 casos.
- TU S1.4: fila prioriza erradas > novas > antigas; respeita sessionSize; mastered só como fallback; faixas embaralham (testar com seed).
- TU S1.5: **suíte crítica** — streak com: sequência perfeita, buraco no meio, hoje aberto, ontem falhou, primeiro dia de uso, virada de mês. Mínimo 6 casos.
- TU S1.6: valores de XP por resultado; meta atingida nos limites (exatamente na meta, um abaixo).
- TU S1.7: actions da store persistem e atualizam estado; hydrate reconstrói estado do banco.

### Testes de integração do sprint

- TI-1.1: fluxo completo sem UI: criar card → treinar 3x com acerto → status vira mastered no banco → contadores refletem.
- TI-1.2: fluxo de dia: registrar treinos até bater meta → `daily_stats.goal_met` = true → streak incrementa no dia seguinte simulado.

### DoD Sprint 1

- [ ] Cobertura de testes ≥ 90% em `src/logic/` (é lógica pura, dá para exigir).
- [ ] Cobertura ≥ 80% em `src/db/`.
- [ ] Nenhum componente de UI acessa SQLite diretamente.
- [ ] Todos os TUs e TIs passam no CI local.
- [ ] Revisão manual: apagar o app e reinstalar preserva comportamento de primeira inicialização (migrations).

---

# Sprint 2 — Onboarding e configuração

**Objetivo**: fluxo de primeira abertura completo: escolher idiomas, persistir, e nunca mais ver o onboarding.

### Tasks

**S2.1 — Tela de onboarding passo 1 (língua nativa)**

- CA1: visual fiel ao protótipo: fundo amberBlast, estrelas decorativas, logo Memsy rotacionado, grade 2 colunas de idiomas com HardShadowBox.
- CA2: seleção única; card selecionado escala 1.04 com borda gameBlue (animação spring do Reanimated).
- CA3: botão "CONTINUAR →" desabilitado (opacity 0.4) até seleção; efeito físico de pressionar (translate 3px + sombra some).

**S2.2 — Tela de onboarding passo 2 (idiomas a aprender)**

- CA1: fundo gameBlue, decoração branca, seleção múltipla com card selecionado em amberBlast rotacionado -1°.
- CA2: idioma nativo escolhido no passo 1 não aparece na lista do passo 2.
- CA3: botão "COMEÇAR! →" habilita com ≥1 seleção; ao confirmar, persiste em `settings` e navega para a tab principal.

**S2.3 — Gate de onboarding**

- CA1: na inicialização, se `settings` não tem idiomas configurados → rota onboarding; senão → tabs.
- CA2: após completar onboarding, matar e reabrir o app vai direto para as tabs.
- CA3: transição onboarding→tabs usa slide com bounce (Reanimated).

**S2.4 — Seletor de par de idiomas (componente pill)**

- CA1: pill "🇫🇷 Francês → 🇧🇷 Português" mostra o par ativo; com múltiplos idiomas, tocar abre bottom sheet para trocar.
- CA2: troca de idioma ativo persiste em `settings` e reflete imediatamente na tela Adicionar.

### Testes unitários

- TU S2.3: lógica do gate (função pura `getInitialRoute(settings)`): sem config → onboarding; com config → tabs.
- TU S2.4: reducer de troca de idioma ativo na store.

### Testes de integração do sprint

- TI-2.1 (RNTL): renderizar onboarding passo 1 → selecionar idioma → botão habilita → avançar → passo 2 sem o idioma nativo na lista → selecionar 2 idiomas → confirmar → settings persistidos com os valores corretos.
- TI-2.2 (Maestro, dispositivo): fluxo completo de onboarding com toques reais + reabrir app pula onboarding.

### DoD Sprint 2

- [ ] Onboarding completo funcional em dispositivo físico.
- [ ] Reinstalação limpa mostra onboarding; segunda abertura não mostra.
- [ ] Animações a 60fps no dispositivo (verificar com perf monitor).
- [ ] Visual conferido lado a lado com o protótipo HTML (tolerância: ajustes de plataforma).
- [ ] TUs e TIs passam.

---

# Sprint 3 — Captura, tradução e swipe

**Objetivo**: o coração do elo 1 e 2 do core loop: digitar palavra → card traduzido → swipe para salvar ou descartar.

### Tasks

**S3.1 — Serviço de tradução (TranslationService)**

- CA1: interface `translate(word, from, to): Promise<TranslationResult>` com `TranslationResult = { translation, phonetic?, gramClass? }`.
- CA2: implementação com a API escolhida (DeepL free tier recomendado); chave via `expo-constants` + `.env` (não commitada).
- CA3: timeout de 8s com erro tipado; erros de rede não crasham o app.
- CA4: cache local: palavra já traduzida no mesmo par de idiomas não chama a API de novo (tabela `translation_cache`).

**S3.2 — Tela Adicionar palavra**

- CA1: visual fiel: fundo chalkWhite com blobs de cor, título "Nova palavra ✦", input com HardShadowBox e foco gameBlue.
- CA2: botão "TRADUZIR ✦" mostra estado de loading (shimmer/pulse no botão) durante a chamada.
- CA3: erro de tradução mostra toast estilizado do design system com retry; input não é limpo.
- CA4: botões Câmera/Voz/Colar: Colar funciona (Clipboard API); Câmera e Voz mostram badge "EM BREVE" (v2) ao tocar.

**S3.3 — Tela do card de tradução**

- CA1: card renderiza palavra (52px Nunito 900), fonética itálica, divisor tracejado, tradução em memsyGreen, badge de classe gramatical em amberBlast.
- CA2: botão de áudio presente, reproduz TTS da palavra via `expo-speech` no idioma de origem.
- CA3: card entra na tela com animação de pop (scale 0.6→1 com overshoot).

**S3.4 — Gesto de swipe (o componente mais crítico do app)**

- CA1: implementado com `react-native-gesture-handler` (Pan) + Reanimated worklets (tudo na UI thread).
- CA2: drag horizontal rotaciona o card proporcionalmente (±12° máx) partindo de -1.5°.
- CA3: overlay "SALVO! ✓" (verde) ou "FORA ✗" (vermelho) com opacity proporcional ao deslocamento.
- CA4: soltar além do threshold (40% da largura) → card voa para fora com spring e dispara `saveCard`/`discardCard`; abaixo do threshold → volta com spring bounce.
- CA5: haptic feedback (expo-haptics): leve ao cruzar o threshold, sucesso ao salvar.
- CA6: swipe funciona idêntico com gesto e com toque nos indicadores laterais (acessibilidade).

**S3.5 — Persistência do fluxo de captura**

- CA1: salvar → card entra no banco com status `new` e retorna à tela Adicionar com input limpo e micro-celebração (confetti breve).
- CA2: descartar → nada persiste; retorna à tela Adicionar.
- CA3: palavra duplicada (mesmo word + par de idiomas) → aviso "Você já tem esse card!" com opção de ver o card existente.

### Testes unitários

- TU S3.1: TranslationService com mock de fetch — sucesso, timeout, erro 4xx/5xx, cache hit não chama API.
- TU S3.5: detecção de duplicata (função pura de normalização: case-insensitive, trim, acentos preservados).

### Testes de integração do sprint

- TI-3.1 (RNTL): digitar palavra → traduzir (API mockada) → card renderiza com dados corretos → salvar → card no banco com status new.
- TI-3.2 (RNTL): mesma palavra 2x → aviso de duplicata → banco tem apenas 1 card.
- TI-3.3 (Maestro, dispositivo): fluxo real com swipe físico para os dois lados.

### DoD Sprint 3

- [ ] Fluxo capturar→traduzir→swipe→persistir completo em dispositivo físico.
- [ ] Swipe a 60fps constantes (perf monitor durante o gesto).
- [ ] App funciona offline para cards já cacheados; erro elegante para tradução sem rede.
- [ ] Chave de API fora do repositório.
- [ ] TUs e TIs passam.

---

# Sprint 4 — Treino e sessões

**Objetivo**: elo 3 do core loop: sessões de treino com começo, meio, fim e recompensa.

### Tasks

**S4.1 — Tela de Deck (Meus Cards)**

- CA1: lista os cards com visual do protótipo: rotações alternadas ±1.5°, badges de status (NOVA amber / EM TREINO sky / DOMINADA mint).
- CA2: contador de cards no header; lista virtualizada (FlashList) para performance com centenas de cards.
- CA3: swipe-to-delete em item da lista com confirmação; botão "TREINAR AGORA →" fixo acima da tab bar.
- CA4: empty state ilustrado quando não há cards ("Adicione sua primeira palavra! ✦" com CTA para a tab Adicionar).

**S4.2 — Fluxo de sessão de treino**

- CA1: sessão criada a partir de `buildTrainingQueue` (Sprint 1) com 10 cards (ou menos se o deck for menor).
- CA2: header mostra progresso "3 / 10" + XP bar animada que cresce a cada resposta.
- CA3: direção da pergunta alterna aleatoriamente por card (frente→verso ou verso→frente), conforme decidido na ideação.
- CA4: tocar no card revela a resposta com animação de flip 3D (rotateY) e os botões de resposta aparecem com pop.
- CA5: responder registra em `training_log`, aplica `nextCardState`, atualiza XP e avança para o próximo card com slide.

**S4.3 — Tela de conclusão de sessão**

- CA1: ao terminar a fila: tela de celebração com confetti (react-native-confetti-cannon ou Reanimated custom), XP total ganho da sessão, acertos/erros.
- CA2: se alguma palavra virou "dominada" na sessão: destaque especial ("🏆 Você dominou: bonjour!").
- CA3: se a meta diária foi batida nesta sessão: celebração adicional + streak atualizado na hora.
- CA4: botões: "TREINAR MAIS" (nova sessão) e "VER PROGRESSO" (tab Progresso).

**S4.4 — Meta diária (configuração)**

- CA1: no primeiro treino, bottom sheet pergunta a meta: 5 / 10 / 20 palavras por dia (visual de cards selecionáveis do design system).
- CA2: meta editável depois nas configurações (ícone ⚙ da tela Adicionar).
- CA3: `daily_stats` atualiza a cada resposta; `goal_met` marca no momento em que cruza a meta.

**S4.5 — Estado vazio do treino**

- CA1: tentar treinar sem cards → empty state com CTA para Adicionar.
- CA2: todos os cards dominados → estado "Tudo dominado! 🏆" com opção de revisar dominadas mesmo assim.

### Testes unitários

- TU S4.2: alternância de direção da pergunta (com seed) distribui ~50/50 em 100 cards.
- TU S4.3: agregação da sessão (função pura `summarizeSession(results)`): XP total, contagens, palavras dominadas na sessão.
- TU S4.4: `daily_stats` cruzando a meta exatamente no card N marca `goal_met` naquele registro.

### Testes de integração do sprint

- TI-4.1 (RNTL): sessão completa de 3 cards mockados → responder todos → tela de conclusão com XP correto → banco reflete training_log e novos status.
- TI-4.2 (RNTL): card com 2 acertos prévios → acertar na sessão → aparece como dominado na conclusão E badge muda no Deck.
- TI-4.3 (Maestro): fluxo real Deck → Treinar → responder 10 → conclusão → voltar ao Deck com badges atualizadas.

### DoD Sprint 4

- [ ] Loop de treino completo e recompensador em dispositivo físico.
- [ ] Flip do card e confetti a 60fps.
- [ ] Regras de dominada e meta diária conferem com os TUs do Sprint 1 (nenhuma lógica duplicada na UI — UI só chama `src/logic/`).
- [ ] Sessão interrompida (app fechado no meio) não corrompe dados: respostas dadas persistem, fila restante descarta.
- [ ] TUs e TIs passam.

---

# Sprint 5 — Progresso, streak e retenção

**Objetivo**: elo 4 do core loop: o usuário vê que está evoluindo e tem motivo para voltar amanhã.

### Tasks

**S5.1 — Tela de Progresso**

- CA1: visual fiel: fundo coralFire, streak widget amberBlast rotacionado com 🔥 + número, grid 2x2 de métricas (acertos %, cards salvos, dominadas, treinadas hoje).
- CA2: métricas calculadas de queries agregadas reais (não de contadores redundantes que podem dessincronizar).
- CA3: gráfico de barras semanal: 7 barras (seg-dom) com cards treinados por dia, hoje em gameBlue, barras com borda navyInk e min-height 6px.
- CA4: barra de meta diária no topo: "7 / 10 hoje" com fill proporcional.

**S5.2 — Streak e sua manutenção**

- CA1: streak exibido usa `calculateStreak` do Sprint 1 — recalculado ao abrir a tela, nunca armazenado como contador incrementado.
- CA2: streak em risco (ontem bateu, hoje ainda não e já passa das 18h locais) mostra o widget em coralFire com "⚠️ Streak em risco!".
- CA3: novo recorde de streak dispara celebração (uma vez por recorde).

**S5.3 — Notificação diária de lembrete**

- CA1: `expo-notifications` configurado; permissão pedida com contexto (após a primeira sessão de treino concluída, não no primeiro launch).
- CA2: notificação local agendada diariamente às 19h locais: "Você tem N palavras para revisar hoje 🔥" (N = cards em treino).
- CA3: se a meta do dia já foi batida, a notificação daquele dia é cancelada.
- CA4: usuário pode desativar/mudar horário nas configurações.

**S5.4 — Tela de configurações**

- CA1: acessível pelo ⚙: mudar meta diária, horário da notificação, gerenciar idiomas (adicionar/remover), sobre o app.
- CA2: remover um idioma pede confirmação e explica que os cards dele ficam ocultos (não deletados).

### Testes unitários

- TU S5.1: funções de agregação de métricas (taxa de acerto, treinadas hoje, dominadas) contra fixtures de training_log.
- TU S5.2: condição de "streak em risco" (função pura com data/hora injetada): antes das 18h não alerta; após 18h sem meta alerta; meta batida não alerta.
- TU S5.3: lógica de agendamento (função pura que decide agendar/cancelar dado o estado do dia).

### Testes de integração do sprint

- TI-5.1 (RNTL): popular banco com 2 semanas de training_log sintético → tela Progresso mostra streak, métricas e gráfico corretos.
- TI-5.2 (RNTL): bater a meta em sessão → widget de streak atualiza sem reiniciar o app.
- TI-5.3 (dispositivo): notificação dispara no horário agendado (teste com horário +2 min); bater a meta cancela a do dia.

### DoD Sprint 5

- [ ] Tela de Progresso com dados reais e corretos em dispositivo físico.
- [ ] Streak sobrevive a: reinício do app, mudança de dia, buraco de dias.
- [ ] Notificação funciona e respeita a meta batida.
- [ ] Nenhuma métrica dessincroniza após 50+ treinos (teste de estresse manual).
- [ ] TUs e TIs passam.

---

# Sprint 6 — Polimento, resiliência e release

**Objetivo**: transformar o app funcional em app lançável.

### Tasks

**S6.1 — Passada de microinterações**

- CA1: todos os botões do app têm o efeito físico de pressionar (audit tela a tela).
- CA2: haptics consistentes: leve em seleções, médio em confirmações, sucesso em celebrações.
- CA3: transições entre tabs com fade rápido; nenhuma tela "pisca" ao montar.

**S6.2 — Estados de borda e resiliência**

- CA1: audit de todos os empty states, loading states e error states (matriz tela × estado documentada e verificada).
- CA2: palavra com caracteres especiais (apóstrofos, hífens, acentos, cirílico) traduz e renderiza corretamente.
- CA3: deck com 500+ cards: lista e fila de treino sem degradação perceptível (gerar fixture de estresse).
- CA4: modo avião: tudo exceto tradução nova funciona; mensagens claras onde não funciona.

**S6.3 — Acessibilidade mínima**

- CA1: todos os elementos interativos com `accessibilityLabel` e `accessibilityRole`.
- CA2: swipe do card tem alternativa por botão (já feito no S3.4 — validar com VoiceOver).
- CA3: contraste de texto verificado nos 6 fundos coloridos (ajustar tons se algum par falhar WCAG AA para texto grande).

**S6.4 — Ícone, splash e identidade**

- CA1: ícone do app no estilo do design system (card com borda e sombra dura, letra M).
- CA2: splash screen com fundo amberBlast e logo.
- CA3: nome de exibição "Memsy" configurado no app.json.

**S6.5 — Build e distribuição**

- CA1: EAS Build configurado; build de produção iOS gerado com sucesso.
- CA2: app instalado via TestFlight em ≥2 dispositivos de teste.
- CA3: versão 1.0.0, changelog inicial escrito.
- CA4: crash reporting configurado (Sentry) com sourcemaps.

**S6.6 — Beta com usuários reais**

- CA1: ≥3 pessoas fora do desenvolvimento usam o app por ≥3 dias.
- CA2: feedback coletado de forma estruturada (formulário curto: o que confundiu, o que faltou, voltaria a usar?).
- CA3: bugs críticos do beta corrigidos antes de fechar o sprint.

### Testes unitários

- Sem novos TUs — sprint de polimento. Regressão: toda a suíte existente deve passar.

### Testes de integração do sprint

- TI-6.1 (Maestro, suite completa E2E): onboarding → adicionar 3 palavras → treinar sessão → bater meta → verificar progresso → matar app → reabrir → estado íntegro. Esta suite vira o smoke test de toda release futura.
- TI-6.2: teste de upgrade: instalar build anterior, criar dados, instalar build novo por cima → dados intactos (valida migrations).

### DoD Sprint 6 (= critério de lançamento da v1)

- [ ] Suite E2E completa passa em dispositivo físico.
- [ ] Zero crashes conhecidos; Sentry limpo após 3 dias de beta.
- [ ] Feedback do beta triado; críticos resolvidos.
- [ ] Build TestFlight aprovado internamente.
- [ ] Checklist da App Store preenchido (screenshots, descrição, privacidade — app coleta zero dados pessoais, o que simplifica o formulário).

---

## Resumo do plano

| Sprint | Entrega                                  | Risco principal                              |
| ------ | ---------------------------------------- | -------------------------------------------- |
| 0      | Projeto configurado + design system base | Reanimated/Gesture Handler com Expo Go       |
| 1      | Toda a lógica de domínio testada         | Nenhum — é o sprint mais seguro              |
| 2      | Onboarding completo                      | Fidelidade visual vs. protótipo              |
| 3      | Captura + tradução + swipe               | Física do swipe; limites da API de tradução  |
| 4      | Sessões de treino com recompensa         | Complexidade de estado da sessão             |
| 5      | Progresso + streak + notificações        | Permissão de notificação; timezone do streak |
| 6      | Release TestFlight                       | Descobertas do beta                          |

## Princípios transversais (valem para todos os sprints)

1. **Lógica em `src/logic/`, sempre pura, sempre testada.** A UI nunca reimplementa regra de negócio.
2. **Teste manual em dispositivo físico faz parte do DoD** de todo sprint com UI. Simulador não valida gesto nem haptic.
3. **Nenhum sprint fecha com teste quebrado.** Testes vermelhos bloqueiam o avanço, sem exceção.
4. **Fidelidade ao design system é critério de aceite**, não sugestão: sombra dura, borda navyInk, Nunito 900, fundos coloridos.
5. **Dívida técnica anotada, nunca silenciosa**: o que ficar para depois entra num TECH_DEBT.md com contexto.
