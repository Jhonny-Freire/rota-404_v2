import logging
import os

from app import create_app
from app.config.settings import load_settings
from app.warmup import start_catalog_warmup

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger("run")

settings = load_settings()
app = create_app(settings)

if __name__ == "__main__":
    debug = settings.debug
    if debug and settings.exposed_to_network:
        # o console do debugger do Werkzeug executa código Python: nunca expô-lo na rede da feira
        logger.warning("FLASK_DEBUG ignorado: HOST=%s aceita conexões da rede.", settings.host)
        debug = False
    # com o reloader (debug) este arquivo roda em dois processos; só o que atende aquece o cache
    serving = not debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if serving and settings.catalog_cache_seconds > 0:
        start_catalog_warmup(app)
    app.run(host=settings.host, port=settings.port, debug=debug)
