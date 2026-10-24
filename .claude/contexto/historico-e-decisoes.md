# Histórico do desenvolvimento e decisões (Rota 404 V2)

Este arquivo resume as sessões de desenvolvimento feitas com o Claude Code (out/2026), as decisões tomadas pelo
usuário e o porquê de cada escolha. Leia antes de mudar algo que pareça "estranho": quase sempre há um motivo aqui.

## Linha do tempo

### Sessão 1 — Base do sistema (09–10/10/2026)
Pedido: implementar a BASE estrutural descrita em `prompt_base (1).md` (contexto em `resumo (1).md` e `planetas (1).md`),
SEM aulas/laboratórios. Entregue:
- Frontend Next.js 16 (App Router, TypeScript, CSS Modules, todas as páginas `"use client"`), backend Flask com
  Controller → Service → Repository → DataSource, Supabase como banco + modo local (`backend/app/data/seed.json`).
- 11 páginas + 404 temática, HUD, breadcrumbs, Bonzi Buddy (6 estados), avatar, foguete, mapas, progresso, pontuação,
  conquistas e ranking (estes três últimos só como estrutura/"em breve").
- Regra de UI: só sprites/PNG via `frontend/config/assets.ts` (nada de lib de ícones, emoji, Unicode-ícone ou SVG-sprite).
  Sprites que faltavam foram desenhados como placeholders pixel art (gerados por script Python fora do projeto).
- Ajustes após inspeção visual: o balão do Bonzi recolhe sozinho ~8 s depois da fala (cobria conteúdo); a fonte
  "Press Start 2P" deforma MAIÚSCULAS acentuadas (Á, Ç, Ã) → nunca usar `text-transform: uppercase` com a fonte display;
  galáxias ordenadas pela idade mínima da faixa (Internet e Web antes de API REST).
- Os arquivos originais `404_status_ok.png` / `404_status_erro.png` vieram com nomes trocados (o "ok" era o X vermelho);
  isso foi corrigido na cópia em `frontend/public`.

### Conexão com o Supabase real (13/10/2026)
- O projeto Supabase da equipe JÁ existia, criado por outro script, com schema diferente do nosso: planetas usam
  coluna `kind` (não `type`), slugs das faixas são `13-ou-menos` / `14-ou-mais`, já havia 16 planetas, 8 aulas e 8 labs
  com `content.engine` / `config.engine`, além de `users`, `user_progress` etc.
- Decisão: NÃO alterar o banco. O código se adaptou (Planet.from_row mapeia `kind` → `type`; sprites `planet-<nome>`).
  Depois, a migration e o seed do repositório foram reescritos a partir da introspecção do banco real, então hoje
  `supabase/` reproduz a produção (para um projeto NOVO). Não é preciso rodar nada no projeto atual.
- Lentidão inicial: cada consulta ao Supabase leva 0,25–1,4 s (região/rede) → origem do "lag" ao abrir telas.

### Fase 2 — Aulas e laboratórios (13/10/2026)
O usuário trouxe novas pixel arts (`assets/`, resolução nativa) e as especificações dos 16 planetas do G1
(`G1 - Internet e Web/S*/*.md`). Decisões do usuário (perguntadas explicitamente):
1. Implementar as cenas seguindo FIELMENTE os .md (falas do Bonzi literais) — depois o escopo foi reduzido para
   "só o S1 por enquanto", e o S2 veio numa rodada seguinte.
2. Narração: voz do navegador (`speechSynthesis`, pt-BR), respeitando Ajustes → Narração e volume.
3. Progresso e pontuação: salvos NO NAVEGADOR (`localStorage`), sem login. Supabase só para ler o catálogo.
Entregue: endpoints `/api/lessons` e `/api/labs`, cache do catálogo no Flask, snapshot local idêntico à produção,
runtime de aulas/labs + kit de cena + progresso + voz, sprites novos (nativos, ampliados por CSS pixelated) e
elementos que faltavam desenhados no mesmo estilo (roteador, wifi, cabo, tablet, casa, página, foto, chave, pessoa,
câmera, microfone). Opção "Liberar todos os planetas (modo apresentação)" em Ajustes.

### S1 publicado (13–14/10/2026)
- Bug: requisições simultâneas davam 503 (`WinError 10035`) porque o cliente padrão do postgrest usa HTTP/2 numa
  conexão única compartilhada entre threads → `backend/app/config/supabase.py` injeta um `httpx.Client(http2=False)`.
- Registro de motores restrito ao S1 (demais planetas abrem em "Prévia"); prévias NÃO contam progresso.
- Página do sistema: rótulos de planetas sobrepostos corrigidos (órbita maior, rótulos mais largos).
- QA dos 4 planetas do S1 no navegador.

### Rodada do colega (14–16/10/2026) — zip `ROTA_404_V2`
O colega refinou a UX (provavelmente com IA também). Mudanças que viraram CONVENÇÃO:
- Aulas: `meta.hints[cena]` + `setHint(texto|null)` → cartão "O que fazer" ao lado do botão de avançar.
- `SpriteButton`/`ActionButton`: props `attention` (anel pulsando no próximo passo) e `focusOnAttention`
  (foco vai para o botão quando ele vira o próximo passo); `ui/revealFocus.ts` rola só o necessário.
- `SceneStage ready`: cantos do palco piscam quando a cena libera o avanço.
- `kit/StageBanner`: faixa de instrução no alto do palco ("o que fazer AGORA").
- Narrator novo (retrato do Bonzi nos labs), página do sistema com HUD de coleção ("x/y concluídos", "Sistema completo!").
- Backend: `from __future__ import annotations` em `data_source.py` — OBRIGATÓRIO no Python 3.12 do colega
  (sem ele, `-> list[Row]` depois de `def list` quebra no import).

### S2 + desempenho (16–17/10/2026)
O usuário pediu o S2 e "deixar sem lag e sem travar". Como o projeto não usa git, o diff contra a versão anterior foi
feito recuperando (cópia, sem restaurar) a pasta antiga da Lixeira do Windows. Resultado:
- Diagnóstico medido simulando notebook fraco de feira (Edge headless, renderização por software, CPU 4x):
  telas caíam para 33–40 FPS. Causas: fundo de estrelas com 2 camadas gigantes deslizando por frações de pixel (maior
  causa), animações `background-position` ("trilhas marchando"), digitação do Bonzi com setState a cada 24 ms, motor
  re-renderizando a cada fala, arrasto com setState por pointermove, cache frio do backend (1,9–2,8 s em "Carregando").
- Correções: fundo em `steps()` (pixels inteiros, mesmo visual), trilhas por `transform`, `useTypewriter` (escreve no
  DOM), `AnimatedSprite` sem setState, `<Engine>` memoizado nos shells, DragBoard por ref + rAF, `backdrop-filter`
  removido, StatusView sem animar `width`. Resultado: 55–60 FPS no mesmo cenário fraco.
- Backend: pré-aquecimento do catálogo no boot (`app/warmup.py`), anti-manada por chave, servir valor vencido
  enquanto revalida, fallback para `seed.json` se o Supabase cair (circuit breaker de 30 s), TTL padrão 3600 s,
  `HOST` configurável (0.0.0.0 para rede da feira), timeouts menores, `FLASK_DEBUG=0` no `.env`.
- S2 implementado e registrado: 2.1 (o CSS module não existia — criado), 2.2, 2.3, 2.4 (variações sem repetir destino).
  QA jogou os 4 planetas; integração corrigiu `kit/Tag.module.css` (ícone espremia o texto; afeta S1 também).

### Versão online no Render (24/10/2026)
Pedido: publicar o Rota no Render (grátis) para usar na feira.
- **Arquitetura escolhida:** frontend como *static site* (CDN, não dorme, grátis) + API Flask como *web service*
  grátis. Motivo: o plano grátis dá 750 h/mês por conta e cada serviço web dorme após 15 min (≈1 min para acordar);
  com só a API como serviço web, apenas um serviço precisa acordar, e dá para mantê-lo acordado nas horas da feira.
- **Frontend:** `next.config.ts` liga `output: "export"` + `trailingSlash` só com `STATIC_EXPORT=1` (o build normal
  para `next start` continua igual). As 4 rotas dinâmicas ganharam `generateStaticParams` lendo
  `backend/app/data/seed.json` (`frontend/lib/staticParams.ts`); galáxia e sistema viraram `GalaxyPage.tsx`/
  `SystemPage.tsx` (cliente) com uma `page.tsx` de servidor. `scripts/flatten-export-segments.mjs` corrige uma falha
  do export do Next 16 (segmentos de prefetch gravados em pastas e pedidos com pontos → 404 em todo prefetch).
- **Backend:** `gunicorn==23.0.0` no `requirements.txt` e `backend/gunicorn.conf.py` (1 processo, 8 threads, mesmo
  pré-aquecimento do `run.py` em `post_worker_init`). No Windows continue com `python run.py`.
- **Testado:** build estático e build normal passando; site estático servido localmente contra a API (navegação sem
  recarregar, aula 1.1 abrindo, nenhum 404); gunicorn no WSL com Python 3.12.3 (health ok, cache 28/28); 110 testes.
  **Deploy feito (24/10/2026):** código no GitHub `Jhonny-Freire/rota-404_v2` (público, sem `.env`), Blueprint
  `rota404` no Render; site https://rota404.onrender.com, API https://rota404-api.onrender.com (lendo do Supabase).
  O Render não completa a barra final das URLs: o `render.yaml` tem reescritas por rota (`/aulas/*` →
  `/aulas/*/index.html` etc.). Rota nova = nova regra lá. Id de planeta inexistente em `/aulas/...` dá página em branco.
- **Aviso:** `npm audit` aponta vulnerabilidades críticas no `next@16.4.0` (corrigidas no 16.4.3). Elas atingem o
  servidor do Next (otimização de imagem, server actions, `use cache`), que não existe no site estático; o
  `next start` do notebook é que fica exposto. Atualizar para 16.4.3 é recomendado.

## Decisões que continuam valendo
- A versão que volta do colega é a BASE OFICIAL: preserve as melhorias dele; não reverta sem motivo técnico forte.
- Python do colega: 3.12 (o do usuário: 3.14). Todo código Python precisa rodar em 3.12.
- Progresso só no navegador (`rota404.progress`). Endpoints de progresso/pontuação/conquistas/ranking/usuários
  continuam 501 (o schema real dessas tabelas no Supabase difere dos models — ver pendências).
- Desbloqueio sequencial dentro de cada sistema; "Liberar todos os planetas" em Ajustes para demonstrações.
- Feira: rodar frontend em PRODUÇÃO (`npm run build` + `npm start`) — o `next dev` pesa 6–7x mais e duplica efeitos.

## Pendências e decisões em aberto
- **Aula 1.1, microteste:** hoje só "dois aparelhos ligados" é resposta certa; "um aparelho com uma conexão" (cabo que
  não leva a nada) conta como errado. O .md fala em "exemplos" (plural) — confirmar com quem escreveu o .md.
- **Celular (≤ 375 px):** a StageBanner quebra em 2 linhas e cobre partes do mapa nos labs 2.3, 2.4 e 1.4; microteste
  da 2.1 apertado (IP digitado cortado); rótulos do mapa do 2.4 se sobrepõem. Precisa de decisão de layout mobile
  (ex.: faixa menor / rótulos ocultos abaixo de 480 px). Notebook e tablet estão ok.
- **Labs:** a altura da fala no painel do Bonzi (componente do colega) muda com o texto e faz a "Área de interação"
  pular ~45 px — sugestão: altura mínima fixa.
- **Lab 2.4:** depois de 2 erros a seta de ajuda fica ligada até o fim e também aponta o servidor certo (coerente com
  o .md, mas tira parte do desafio). **Lab 2.3:** cada servidor recebe exatamente 1 domínio; o 3º sai por eliminação.
- **Tablets na rede da feira:** backend pronto (`HOST=0.0.0.0`, `CORS_ORIGINS=http://<IP>:3000`), frontend deriva a
  URL da API do host; `next dev` recusa outros aparelhos (use build+start); liberar portas 3000/5000 no firewall.
  NÃO testado em aparelho real.
- **Python 3.12:** compatibilidade verificada só estaticamente; rodar `python -m unittest discover -s tests` no 3.12.
- **Fontes:** `next/font/google` baixa as fontes no build → faça o build com internet (ou migre para `next/font/local`).
  Se o `next dev` subir sem internet, serve fonte de reserva (Arial esticada) até ser reiniciado.
- **Gamificação real:** `user_progress` no banco usa `entity_type/entity_id/progress_percent`; `scores` tem `galaxy_id`;
  `achievements` não tem `rarity` — os models/contratos do frontend precisam ser alinhados antes de implementar.
- **Render:** no ar; atualizar o Next para 16.4.3; configurar monitor (UptimeRobot) em `/api/health` nas horas da feira; no celular (acesso por QR code) valem as pendências de layout ≤ 375 px acima.
- **S3 e S4:** 8 planetas com especificação pronta, motores ainda em stub (modo prévia).
- **Segurança do fluxo por zip:** `backend/.env` (com a chave secreta do Supabase) viaja dentro do zip. Mantenha o
  zip só entre a equipe ou envie o `.env` por outro canal. Recomendação forte: usar git (mesmo local) para versionar
  e ver diffs entre as rodadas.
