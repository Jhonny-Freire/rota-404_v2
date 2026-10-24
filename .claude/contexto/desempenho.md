# Desempenho: o que foi medido, o que foi corrigido e as regras

O usuário relatou que o sistema "estava começando a travar". Na máquina de desenvolvimento (GPU forte) tudo rodava a
60 FPS, o que ESCONDIA o problema. O alvo real é o notebook fraco da feira (e tablets).

## Como medir (reproduza antes de mexer em animações)
- Meça sempre o build de PRODUÇÃO (`npm run build` + `npm start`). O `next dev` pesa 6–7x mais em JS (3,9–4,4 MB contra
  0,52–0,67 MB por página), compila cada rota na 1ª visita e o StrictMode duplica efeitos e requisições.
- Simule a máquina fraca: Chrome/Edge DevTools → Performance → CPU 4x slowdown; em Rendering ligue "Paint flashing" e
  "Frame Rendering Stats". (Na medição original foi usado Edge headless com composição por software + CPU 4x.)
- Métricas usadas: FPS e pior quadro via `requestAnimationFrame` por 4–5 s com a aba em PRIMEIRO PLANO (aba oculta não
  desenha quadros); long tasks (`PerformanceObserver('longtask')`); `document.getAnimations()` (quais propriedades
  animam); tempo até o conteúdo (quando o "Carregando" some); tempos de `performance.getEntriesByType('resource')`.
- Técnica A/B: desligue um grupo por vez (CSS injetado com `animation: none`) e compare o FPS para atribuir o custo.

## Resultado (cenário fraco: CPU 4x + renderização por software, 1440x900)
| Página | Antes | Depois |
|---|---|---|
| Landing | 40,2 FPS | 57,7 FPS |
| /galaxias | 36,8 (pior quadro 150 ms) | 60 |
| /sistemas/dispositivos-e-conexao | 32,6 | 59,5 |
| Aula 1.1 | 37,0 | 60 |
| Lab 1.3 | 39,0 | 60 |
| Lab 1.4 | 34,9 | 60 |
| Aula 2.1 | 36,6 (1 long task) | 60 |
Backend: 1ª chamada de cada rota do catálogo caiu de 0,29–1,42 s (cache frio, até 4 consultas sequenciais ao
Supabase) para ~3 ms (pré-aquecimento no boot + cache de 1 h). Tela "Carregando" fria: de 1,9–2,8 s para ~0,3–0,5 s.

## Causas encontradas (em ordem de impacto) e correções aplicadas — NÃO reverta
1. **Fundo de estrelas** (`components/layout/SpaceBackground.module.css`): 2 camadas gigantes deslizando por frações de
   pixel forçavam recompor a tela inteira 60x/s. Correção: deriva em `steps(512)` (pixels inteiros, mesma velocidade) e
   camada com +512 px em vez de +1024 px. Visual idêntico.
2. **"Trilhas marchando"** (`components/space/Connection`, trilha da landing, linhas do kit): `background-position` em
   animação infinita = repintura na thread principal a cada quadro. Correção: pseudo-elemento animado só com `transform`.
3. **Digitação do Bonzi/Narrador**: setState a cada 24 ms. Correção: `hooks/useTypewriter.ts` escreve direto no DOM
   (2 letras a cada 48 ms; o `<span ref={typedRef}>` precisa ficar SEM filhos no JSX).
4. **`AnimatedSprite`**: setState por quadro (15 commits/s nos mapas). Correção: troca a classe direto no DOM, pausa com
   a aba oculta, memo.
5. **Motor re-renderizando a cada fala/dica/feedback**: os shells agora renderizam o motor com `memo`.
6. **Arrastar** (DragBoard e lab 1.3): fantasma movido por `style`/ref, `elementFromPoint` no máximo 1x por quadro,
   linha de prévia isolada (`PreviewWire`).
7. **`backdrop-filter`** no HUD e no PixelPanel: removido (no Chrome nem era aplicado; no iPad o blur era refeito a cada
   quadro sobre o fundo animado).
8. **StatusView "Carregando"**: pontos por `opacity` em vez de animar `width`.
9. **`useReducedMotion`**: uma única MediaQueryList para o app inteiro.
10. **Frontend**: cache de GETs do catálogo em memória (5 min) + `useAsync` com `cacheKey` → voltar a uma página já
    visitada é instantâneo; requisições de aula/lab + sistema em paralelo.
11. **Backend**: pré-aquecimento (`app/warmup.py`), anti-manada por chave, servir valor vencido enquanto revalida,
    fallback para `seed.json` com o Supabase fora (circuit breaker 30 s), TTL 3600 s, timeouts 3 s/5 s.

## Regras para qualquer código novo (especialmente motores do S3/S4)
1. Animação infinita: SÓ `transform` e `opacity`. Nunca `background-position`, `box-shadow`, `filter`, `width/height`,
   `top/left`, `clip-path` em keyframes infinitos. Brilho piscando = `::after` estático com o efeito + animar a
   `opacity` dele. Linha "marchando" = pseudo-elemento mais largo com `translateX` e `overflow: hidden` no pai.
2. Prefira efeitos de atenção finitos (2–4 repetições) ou com `steps()`. No máximo ~6 animações infinitas simultâneas
   por cena; o que já cumpriu o papel deve parar.
3. Movimento sempre por `transform` (`Place` e `Packet` do kit já fazem assim). `filter: drop-shadow`/`blur` só estático
   e em elementos pequenos (nunca no tamanho do palco ou em cartões grandes que se movem).
4. Nada de `setState` em `pointermove` ou por quadro no componente raiz do motor: guarde o ponto num ref, agrupe 1x por
   quadro com `requestAnimationFrame` e atualize só um subcomponente folha (`forwardRef` + `useImperativeHandle`).
   No máximo 1 `getBoundingClientRect`/`elementFromPoint` por quadro; meça no início do gesto e reaproveite.
5. Sem `setInterval` < 50 ms com setState. Use `useSequence`/`useTimers` do kit. Não implemente digitação própria: use
   `say()` e o Narrator.
6. Sem `backdrop-filter`, sem novas camadas de tela cheia, sem `will-change` em algo que não se move, sem painéis
   translúcidos grandes sobre o fundo animado.
7. Motor não chama a API (usa só o contexto que o shell já carregou). Nunca faça polling de `/api/health` (não usa cache).
8. Navegação entre planetas sempre por `planetHref(type, planet.id, system.slug)` (id do planeta + `?sistema=`), que é
   exatamente o que o pré-aquecimento do backend cobre.
9. Animação infinita perto da borda da tela não cresce para fora (`scale` > 1, `translate` para fora): o transform conta
   na área de rolagem; a página ganha alguns px a cada ciclo, a barra de rolagem aparece e some e a tela "treme" de
   lado (anel do `SpriteButton attention`, 24/10/2026). Pulse com `opacity`.

## Feira
- Rode `npm run build` (com internet, por causa das fontes) e `npm start`. Backend com `FLASK_DEBUG=0`.
- Ligue "Reduzir animações" em Ajustes se algum computador ainda engasgar: tudo continua funcionando sem animação.
