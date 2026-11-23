import json
from pathlib import Path
from django.core.management.base import BaseCommand
from apps.auth.repository import reconcile


class Command(BaseCommand):
    help = 'Audit existing workspace records; --apply inserts missing mappings only and never rewrites originals.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--report')

    def handle(self, *args, **options):
        result = reconcile(apply=options['apply'])
        text = json.dumps(result, indent=2)
        if options['report']:
            Path(options['report']).write_text(text, encoding='utf-8')
        self.stdout.write(text)
