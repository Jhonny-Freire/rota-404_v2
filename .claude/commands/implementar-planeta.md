---
description: Implementa (ou revisa) o motor de uma aula/laboratório do Rota 404 a partir do .md do planeta
argument-hint: <código do planeta, ex.: 3.1>
---

Implemente o motor do planeta **$ARGUMENTS** do Rota 404, seguindo o processo que já foi usado no S1 e no S2.

1. **Contexto**: leia `CLAUDE.md`, `.claude/contexto/motores-g1.md` (tabela dos planetas, padrões, passo a passo),
   `.claude/contexto/runtime-shells-e-kit.md` (contrato e kit) e `.claude/contexto/desempenho.md`.
2. **Especificação**: ache o `.md` do planeta em `G1 - Internet e Web/S*/` (aula<X>-<Y>.md ou lab<X>-<Y>.md) e leia
   inteiro. Liste cenas/etapas, falas do Bonzi (literais), textos de feedback, variações e o que NÃO pode revelar.
   Ambiguidades: escolha a leitura mais fiel, registre no código (comentário curto) e no histórico — e pergunte ao
   usuário se for uma decisão pedagógica relevante.
3. **Chave do motor**: confira na API (`/api/lessons/<slug>` ou `/api/labs/<slug>` com o backend no ar) que
   `content.engine`/`config.engine` é igual ao nome da pasta em `frontend/components/learning/engines/`.
4. **Referência de qualidade**: leia pelo menos um motor do mesmo tipo já pronto (aulas: `o-que-e-uma-rede`,
   `ip-dominio-e-site`; labs: `missao-recuperar-a-conexao`, `encontrando-o-destino`, `missao-encontrar-o-servidor`) e
   siga os mesmos padrões: subcomponente por cena com `key`, `meta.hints` + `setHint` nas aulas, `StageBanner` +
   `attention` no próximo passo nos labs, `useSequence`/`useTimers` com `{hold}` nas pausas de fala, variação por
   `attempt` com `useSeededRandom`, `mistake()` só em erro real, `setStep(meta.steps.length)` antes de `finish()`.
5. **Implemente** substituindo o stub da pasta (só nessa pasta + o CSS module dela). Sprites só via
   `config/assets.ts` (se faltar um elemento, desenhe um PNG pixel art no mesmo estilo nativo dos de
   `frontend/public/sprites/elements/` e acrescente a chave em `ELEMENTS`).
6. **Registre** a chave em `frontend/components/learning/engines/index.ts` (só quando o motor estiver completo).
7. **Verifique**: `npm run typecheck`; abra `/aulas/<planetId>?sistema=<slug>` ou `/laboratorios/...` (ids em
   `motores-g1.md`), jogue todas as cenas/etapas com um erro e depois o acerto, conclusão, "Jogar de novo", progresso
   salvo, "Próximo planeta"; teste em 1440x900, tablet e 375 px, com "Reduzir animações" e só com teclado; confira
   o console. Salve e restaure o `localStorage` do usuário durante os testes.
8. **Registre** no `.claude/contexto/historico-e-decisoes.md` o que foi feito, decisões e pendências, e atualize a
   tabela de status em `motores-g1.md` e no `CLAUDE.md`.
