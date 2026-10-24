"""Servidor de produção (Render): gunicorn -c gunicorn.conf.py run:app"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
# um processo só: o cache do catálogo fica em memória (e o plano grátis tem 512 MB); as threads atendem em paralelo
workers = 1
worker_class = "gthread"
threads = 8
timeout = 60


def post_worker_init(worker):
    # o mesmo pré-aquecimento do python run.py, no processo que atende
    from app.warmup import start_catalog_warmup
    from run import settings

    if settings.catalog_cache_seconds > 0:
        start_catalog_warmup(worker.wsgi)
