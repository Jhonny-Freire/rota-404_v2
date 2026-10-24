# Rota 404

Base do sistema educacional Rota 404: frontend em Next.js (`frontend/`), API em Flask (`backend/`) e banco no Supabase (`supabase/`).

Contexto completo para desenvolvedores (e para o Claude Code): `CLAUDE.md` e `.claude/contexto/`.

## Pré-requisitos

- Node.js 20.9 ou superior (com npm)
- Python 3.12 ou superior
- Um projeto no Supabase (opcional: a API também roda com dados locais)

## Supabase

1. No SQL Editor do projeto, execute `supabase/migrations/20261009000000_init_schema.sql`.
2. Em seguida, execute `supabase/seed.sql`.

Com a Supabase CLI (projeto já vinculado), use `supabase db push` e depois rode o `supabase/seed.sql`.

## Variáveis de ambiente

- `backend/.env` (copie de `backend/.env.example`):
  - `SUPABASE_URL`: URL do projeto
  - `SUPABASE_KEY`: chave `service_role` (somente no servidor, nunca no frontend)
  - `DATA_SOURCE`: `auto` (padrão), `supabase` ou `local`
  - `CORS_ORIGINS`: origens permitidas, separadas por vírgula
  - `PORT` e `FLASK_DEBUG` (`1` só no desenvolvimento; na feira, `0`)
  - `HOST`: onde a API escuta. `127.0.0.1` (padrão) atende só este computador; `0.0.0.0` aceita a rede local (tablets)
  - `CATALOG_CACHE_SECONDS`: validade do cache do catálogo em memória, em segundos (padrão `3600`; `0` desliga). Vencido, o dado é servido na hora e atualizado em segundo plano
  - `FALLBACK_TO_LOCAL`: `1` (padrão) mantém o catálogo no ar se o Supabase falhar, servindo o cache e `backend/app/data/seed.json`; `0` responde 503
- `frontend/.env.local` (opcional; copie de `frontend/.env.example`):
  - `NEXT_PUBLIC_API_URL`: só se a API estiver em outro endereço. Sem ela, o navegador usa `http://<host da página>:5000/api`,
    o que já funciona no próprio computador e nos tablets da rede. Não use `localhost` aqui se houver tablets.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
python run.py                 # http://127.0.0.1:5000/api/health
```

Modo local sem Supabase: use `DATA_SOURCE=local`, ou deixe `DATA_SOURCE=auto` sem `SUPABASE_URL`/`SUPABASE_KEY`.
Nesse modo a API lê `backend/app/data/seed.json` (mesmo conteúdo do `seed.sql`).

Ao subir com `python run.py`, a API pré-aquece o cache do catálogo em segundo plano (log `Cache do catálogo pré-aquecido`),
então o primeiro visitante não espera o Supabase. Para publicar conteúdo novo do banco antes do cache vencer, reinicie a API.

### Na feira (tablets na mesma rede)

O navegador do tablet chama a API direto, e `localhost` nele é o próprio tablet. No notebook que roda tudo
(troque `192.168.0.10` pelo IP dele, visto com `ipconfig`):

- `backend/.env`: `FLASK_DEBUG=0`, `HOST=0.0.0.0` e `CORS_ORIGINS=http://localhost:3000,http://192.168.0.10:3000`
- frontend: não precisa de `NEXT_PUBLIC_API_URL` (o tablet abre `http://192.168.0.10:3000` e chama `http://192.168.0.10:5000/api` sozinho)
- frontend com `npm run build` e `npm run start` (o `next dev` bloqueia outros dispositivos sem `allowedDevOrigins`)
- Firewall do Windows: liberar as portas 3000 e 5000 na rede privada

Com `HOST` fora do loopback, a API ignora `FLASK_DEBUG=1`: o debugger do Werkzeug executa código e não pode ficar exposto na rede.

## Publicar no Render (versão online grátis)

O `render.yaml` na raiz cria dois serviços grátis no [Render](https://render.com):

- `rota404-api`: a API Flask (gunicorn, `backend/gunicorn.conf.py`). No plano grátis ela **dorme após 15 min sem
  acesso** e leva cerca de 1 min para acordar.
- `rota404`: o frontend como **site estático** (`STATIC_EXPORT=1` gera `frontend/out/`). Fica num CDN e não dorme.
  Cada galáxia, sistema e planeta vira um HTML a partir de `backend/app/data/seed.json`: planeta novo exige novo deploy
  (o que já acontece, porque o motor dele é código).

Passo a passo:

1. Suba o projeto para um repositório **privado** no GitHub (o Render só publica a partir de um repositório Git).
   O `.gitignore` já deixa de fora `.env`, `node_modules`, `.next`, `out` e as venvs. Antes do primeiro push,
   confira que `backend/.env` não aparece em `git status`.
2. No Render: **New > Blueprint**, escolha o repositório. Ele lê o `render.yaml` e pede os valores marcados
   `sync: false`:
   - `SUPABASE_URL` e `SUPABASE_KEY` (a mesma chave do `backend/.env`; fica guardada só no Render)
   - `CORS_ORIGINS`: `https://rota404.onrender.com` (o endereço do site; se o nome estiver ocupado, o Render
     acrescenta um sufixo, então confira o endereço real no painel)
   - `NEXT_PUBLIC_API_URL`: `https://rota404-api.onrender.com/api` (o endereço real da API + `/api`)
3. Se algum endereço mudou depois de criados os serviços, corrija as variáveis em **Environment** e faça
   **Manual Deploy** do site (o `NEXT_PUBLIC_API_URL` é fixado no build).
4. Teste: `https://<api>/api/health` deve responder `"status": "ok"`; depois abra o site.

No dia da feira:

- Abra o site uns 2 minutos antes para acordar a API. Para mantê-la acordada durante o evento, use um monitor grátis
  (UptimeRobot, cron-job.org) chamando `https://<api>/api/health` a cada 10 min **só nas horas da feira**: o plano
  grátis dá 750 h/mês por conta, e o ping também evita que o Supabase grátis pause por inatividade.
- O progresso fica no navegador de cada aparelho (como no modo local).
- Tenha o notebook com a versão local pronta como plano B (Wi-Fi de evento costuma falhar).

## Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

## Testes

```bash
cd backend
python -m unittest discover -s tests   # com a venv ativada

cd ../frontend
npm run typecheck
```
