import os
import sys

# Adiciona o diretório da aplicação e o pacote app no PYTHONPATH
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

app_inner = os.path.join(app_dir, "app")
if app_inner not in sys.path:
    sys.path.insert(0, app_inner)

os.environ["ENVIRONMENT"] = "test"
os.environ["REDIS_HOST"] = "127.0.0.1"
os.environ["REDIS_PORT"] = "6379"
os.environ["REDIS_PASSWORD"] = "redis_seguro_123"
os.environ["RABBITMQ_HOST"] = "127.0.0.1"
os.environ["RABBITMQ_PORT"] = "5672"
os.environ["RABBITMQ_USER"] = "guest"
os.environ["RABBITMQ_PASSWORD"] = "guest"
os.environ["LOG_LEVEL"] = "DEBUG"
os.environ["LOG_TO_FILE"] = "false"
