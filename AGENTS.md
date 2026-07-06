# AGENTS.md

## Memsy

App mobile de flash cards para aprender idiomas. Local-first, sem backend, sem conta. Usuário captura palavras, recebe tradução/pronúncia, salva com swipe e revisa por repetição espaçada. Tudo persiste em SQLite local.

## Stack

Expo + React Native · TypeScript strict · expo-router · Zustand · expo-sqlite · Reanimated + Gesture Handler · Jest + React Native Testing Library · Maestro (E2E)

## Arquitetura

```
app/              rotas (expo-router)
src/logic/        regras de negócio — funções PURAS, sem side effects
src/db/           migrations + repositórios (única camada que toca SQLite)
src/store/        Zustand — persiste no SQLite antes de atualizar memória
src/services/     APIs externas (tradução, TTS)
src/components/   primitivas visuais (HardShadowBox, GameButton, Pill...)
src/theme/        tokens.ts — cores, bordas, sombras, raios
```

## Fonte de verdade e progresso

- Leia `docs/memsy_plano_desenvolvimento.md` antes de iniciar qualquer sprint.
- Use o plano como fonte de verdade para escopo, critérios de aceite, testes e DoD.
- Mantenha `PROGRESS.md` atualizado.
- Ao terminar cada sprint, marque a sprint como concluída em `PROGRESS.md`.
- `CLAUDE.md` deve apontar para este arquivo com `@AGENTS.md`; este arquivo não deve importar a si mesmo.

## Regras invioláveis

1. **UI nunca reimplementa lógica.** Regras de negócio (status do card, streak, fila de treino, XP) vivem em `src/logic/` como funções puras e são apenas chamadas pela UI.
2. **Nenhum componente importa `expo-sqlite`.** Todo acesso a dados passa pelos repositórios em `src/db/`.
3. **Streak e métricas são recalculados dos dados-fonte** (`daily_stats`, `training_log`), nunca contadores incrementados.
4. **Toda função em `src/logic/` nasce com teste unitário.** Cobertura mínima: 90% em `src/logic/`, 80% em `src/db/`.
5. **Animações e gestos rodam na UI thread** (Reanimated worklets). O swipe do card deve manter 60fps em dispositivo físico.
6. **Cores só via `src/theme/tokens.ts`.** Nunca use hex hardcoded em componente.
7. **Migrations são append-only.** Nunca edite/apague migration antiga depois de criada.
8. **Dívida técnica deve ser documentada.** Se algo ficar para depois, registre com contexto em `TECH_DEBT.md`.

## Design system

Estilo: maximalista, game & fun. Anti-minimalismo.

- Sombras: duras, offset sólido, sem blur — `4px 4px 0 navyInk` (componentes), `6px 6px 0` (cards). Implementadas como `View` deslocada atrás (RN não tem box-shadow offset sólido confiável).
- Bordas: 2.5–3px `navyInk` em tudo que é interativo.
- Fonte: Nunito (400/700/900). Títulos e botões: 900, uppercase.
- Botões: efeito físico ao pressionar — translate(3,3) + sombra some.
- Fundo branco puro (`#fff`) proibido — usar `chalkWhite` (`#fffdf5`). Fundos de tela são coloridos por tela (ver tokens).
- Cards levemente rotacionados (±1.5°).

Paleta em `src/theme/tokens.ts`:

- `gameBlue` `#067bc2`
- `sky` `#84bcda`
- `amberBlast` `#ecc30b`
- `coralFire` `#f37748`
- `lobster` `#d56062`
- `memsyGreen` `#05a77d`
- `navyInk` `#1a1a2e`
- `chalkWhite` `#fffdf5`
- `bubbleGum` `#ffb3c6`
- `mintPop` `#b8f0e0`

## Domínio

- Card: status `new` → `training` (1º treino) → `mastered` (3 acertos seguidos).
- `wrong` zera a sequência e rebaixa `mastered` → `training`.
- `almost` não altera a sequência.
- Fila de treino: erradas primeiro > novas > mais antigas. `mastered` só como fallback. Máx 10 por sessão.
- XP: `correct` 10 · `almost` 5 · `wrong` 1.
- Streak: dias consecutivos com meta batida; dia atual em aberto não quebra.
- Duplicatas: mesma palavra (case-insensitive, trim) no mesmo par de idiomas é bloqueada.

## Comandos

```bash
npm start          # Expo dev server
npm test           # Jest
npm run lint       # ESLint
npm run lint:fix   # ESLint auto-fix
maestro test .maestro/   # E2E (dispositivo/simulador)
```

## Testes

- Unitário (Jest): toda lógica pura e repositórios (banco em memória).
- Integração (RNTL): fluxos por tela com API de tradução mockada.
- E2E (Maestro): smoke test completo — onboarding → adicionar → treinar → progresso → reabrir app. Roda antes de todo release.
- Teste manual em dispositivo físico é obrigatório para gestos, haptics e performance de animação.
- Antes de fechar sprint: `npm run lint` e `npm test` devem passar.

## Cuidados conhecidos

- Reanimated + Gesture Handler podem exigir development build (`eas build --profile development`) em vez de Expo Go.
- Chave da API de tradução em `.env` (nunca commitada), acessada via `expo-constants`.
- Traduções são cacheadas em `translation_cache` — verificar cache antes de chamar a API.
- Datas do streak usam data local do dispositivo (`YYYY-MM-DD`), atenção a timezone em testes.
