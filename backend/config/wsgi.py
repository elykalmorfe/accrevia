import os

from django.core.wsgi import get_wsgi_application

from apps.search.services.warmup import start_search_warmup

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
start_search_warmup()
