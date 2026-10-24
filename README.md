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
  - `NEXT_PUBLIC_API_URL`: só se a API estiver em outro endereço. Sem ela, o navegador usa `http://<host da página>:9001/api`,
    o que já funciona no próprio computador e nos tablets da rede. Não use `localhost` aqui se houver tablets.

## Rodar com um clique (Windows)

Dê dois cliques em `rodar.bat` (na raiz). Ele cria o `backend\.venv` e instala as dependências se faltarem, faz o
`npm install` na primeira vez, abre o backend e o frontend em duas janelas e abre o navegador em `http://localhost:9000`.
Na feira, use `rodar.bat feira` (num terminal): faz `npm run build` e sobe com `npm start`. Para parar, feche as duas janelas.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
python run.py                 # http://127.0.0.1:9001/api/health
```

Modo local sem Supabase: use `DATA_SOURCE=local`, ou deixe `DATA_SOURCE=auto` sem `SUPABASE_URL`/`SUPABASE_KEY`.
Nesse modo a API lê `backend/app/data/seed.json` (mesmo conteúdo do `seed.sql`).

Ao subir com `python run.py`, a API pré-aquece o cache do catálogo em segundo plano (log `Cache do catálogo pré-aquecido`),
então o primeiro visitante não espera o Supabase. Para publicar conteúdo novo do banco antes do cache vencer, reinicie a API.

### Na feira (tablets na mesma rede)

O navegador do tablet chama a API direto, e `localhost` nele é o próprio tablet. No notebook que roda tudo
(troque `192.168.0.10` pelo IP dele, visto com `ipconfig`):

- `backend/.env`: `FLASK_DEBUG=0`, `HOST=0.0.0.0` e `CORS_ORIGINS=http://localhost:9000,http://192.168.0.10:9000`
- frontend: não precisa de `NEXT_PUBLIC_API_URL` (o tablet abre `http://192.168.0.10:9000` e chama `http://192.168.0.10:9001/api` sozinho)
- frontend com `npm run build` e `npm run start` (o `next dev` bloqueia outros dispositivos sem `allowedDevOrigins`)
- Firewall do Windows: liberar as portas 9000 e 9001 na rede privada

Com `HOST` fora do loopback, a API ignora `FLASK_DEBUG=1`: o debugger do Werkzeug executa código e não pode ficar exposto na rede.

## Publicar no Render (versão online grátis)

No ar em https://rota404.onrender.com (API em https://rota404-api.onrender.com). O `render.yaml` na raiz cria, pelo
Render > New > Blueprint, dois serviços grátis a partir do GitHub (`Jhonny-Freire/rota-404_v2`):

- `rota404-api`: a API Flask com gunicorn (`backend/gunicorn.conf.py`). No plano grátis ela **dorme após 15 min sem
  acesso** e leva cerca de 1 min para acordar. Variáveis no painel: `SUPABASE_URL`, `SUPABASE_KEY`,
  `CORS_ORIGINS=https://rota404.onrender.com`.
- `rota404`: o frontend como **site estático** (`STATIC_EXPORT=1` gera `frontend/out/`; não dorme). Variável:
  `NEXT_PUBLIC_API_URL=https://rota404-api.onrender.com/api` (fixada no build). Cada galáxia, sistema e planeta vira
  um HTML a partir de `backend/app/data/seed.json`: planeta novo exige novo deploy.

Cada `git push` na `main` republica os dois. Na feira, mantenha a API acordada com um monitor grátis (UptimeRobot)
chamando `https://rota404-api.onrender.com/api/health` a cada 10 min, só nas horas do evento (750 h grátis/mês).

## Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:9000
```

## Testes

```bash
cd backend
python -m unittest discover -s tests   # com a venv ativada

cd ../frontend
npm run typecheck
```
