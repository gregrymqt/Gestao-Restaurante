import os
import sys

# Adiciona o diretório da aplicação no PYTHONPATH
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

os.environ["ENVIRONMENT"] = "test"
os.environ["REDIS_HOST"] = "127.0.0.1"
os.environ["REDIS_PORT"] = "6379"
os.environ["REDIS_PASSWORD"] = "redis_seguro_123"
