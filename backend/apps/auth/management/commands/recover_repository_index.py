from django.core.management.base import BaseCommand
from apps.auth.models import RepositoryEntry
from apps.auth.repository_index import schedule_index


class Command(BaseCommand):
    help = 'Retry index synchronization for committed repository documents without changing file records.'

    def add_arguments(self, parser):
        parser.add_argument('--document-id', action='append')

    def handle(self, *args, **options):
        rows = RepositoryEntry.objects.filter(kind='document')
        if options['document_id']:
            rows = rows.filter(record_id__in=options['document_id'])
        for row in rows.iterator():
            schedule_index(row.record_id)
        self.stdout.write(f'Queued {rows.count()} document index checks.')
