---
description: Prepara o ambiente e entende o que mudou ao receber uma nova versão (zip) do Rota 404 de outro membro da equipe
argument-hint: [caminho opcional do zip ou da pasta da versão anterior, para comparar]
---

Recebemos uma nova versão do projeto (zip vindo de outro membro da equipe). Faça, nesta ordem:

1. **Leia** `CLAUDE.md` e `.claude/contexto/historico-e-decisoes.md` (a seção mais recente diz o que a última pessoa fez).
2. **Descubra o que mudou.** Se foi informado um caminho da versão anterior ($ARGUMENTS) ou houver um zip anterior
   disponível, extraia-o numa pasta temporária FORA do projeto e compare só o código
   (`diff -rq` excluindo `node_modules`, `.next`, `.venv`, `venv`, `__pycache__`, `*.tsbuildinfo`, `package-lock.json`),
   depois leia os diffs relevantes. Sem versão anterior, use o histórico e confira o código atual contra o que os
   arquivos de `.claude/contexto/` descrevem. Resuma ao usuário o que mudou e por quê (aparente).
3. **Trate a versão recebida como base oficial**: não reverta mudanças da outra pessoa; se achar um problema nelas,
   explique e proponha a correção mínima que preserve a intenção.
4. **Prepare o ambiente** (o zip não traz dependências):
   - `cd backend; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt`
     (no Linux/WSL: `source .venv/bin/activate`). Confira se `backend/.env` existe (sem exibir o conteúdo da chave).
   - `cd frontend; npm install`.
5. **Valide**: `python -m unittest discover -s tests` (backend), `npm run typecheck` e `npm run build` (frontend),
   suba `python run.py` e `npm run dev` e confira `http://127.0.0.1:5000/api/health` e as páginas principais.
6. **Relate** ao usuário: o que mudou, se tudo passou, e qualquer pendência encontrada. Pergunte qual é a próxima
   tarefa (normalmente o próximo sistema/planeta — ver "Próximos passos" no `CLAUDE.md`).
