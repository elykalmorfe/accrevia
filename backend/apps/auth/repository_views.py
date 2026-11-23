import json
import time
import uuid
import re
from django.http import StreamingHttpResponse, FileResponse
from django.conf import settings
from django.db import close_old_connections, connection
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotAuthenticated, PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.renderers import JSONRenderer
from .session_auth import session_account
from .models import RepositoryEntry, PortalFile
from .repository import snapshot, changes, mutate, VersionConflict, record, may_read, may_write, campus_id
from .portal_storage import store_file
from .workspace_storage import workspace_database, workspace_source


def account_for(request):
    account = session_account(request)
    if not account:
        raise NotAuthenticated('Sign in to use the repository.')
    return account


class RepositorySnapshotView(APIView):
    def get(self, request):
        return Response(snapshot(account_for(request)))


@method_decorator(csrf_protect, name='dispatch')
class RepositoryMutationView(APIView):
    def post(self, request):
        account = account_for(request)
        try:
            return Response(mutate(account, request.data.get('operationId'), request.data.get('operations'), request.data.get('context')))
        except VersionConflict as exc:
            return Response({'detail': str(exc), 'conflict': True}, status=409)


class EventStreamRenderer(JSONRenderer):
    media_type = 'text/event-stream'
    format = 'event-stream'


class RepositoryEventsView(APIView):
    renderer_classes = [JSONRenderer, EventStreamRenderer]
    def get(self, request):
        account = account_for(request)
        from .repository_index import dispatch_due_index_jobs
        dispatch_due_index_jobs()
        try:
            since = max(0, int(request.headers.get('Last-Event-ID') or request.GET.get('since') or 0))
        except ValueError:
            return Response({'detail': 'Invalid event cursor.'}, status=400)
        if request.GET.get('poll') == '1':
            return Response(changes(account, since))

        def stream():
            nonlocal since
            yield ':' + ' ' * 2048 + '\n\n'
            subscriber = None
            redis_client = None
            try:
                from redis import Redis
                redis_client = Redis.from_url(settings.CELERY_BROKER_URL,socket_connect_timeout=1,socket_timeout=2)
                subscriber = redis_client.pubsub(ignore_subscribe_messages=True)
                subscriber.subscribe('accrevia.repository.committed')
            except Exception:
                if subscriber:
                    subscriber.close()
                subscriber = None
            # Bounded streams reconnect automatically; every reconnect revalidates the session.
            deadline = time.monotonic() + 25
            try:
                while time.monotonic() < deadline:
                    if not connection.in_atomic_block:
                        close_old_connections()
                    current_account = session_account(request)
                    if not current_account:
                        break
                    batch = changes(current_account, since)
                    from .repository_index import dispatch_due_index_jobs
                    dispatch_due_index_jobs()
                    if batch['revision'] > since:
                        since = batch['revision']
                        yield f'id: {since}\ndata: {json.dumps(batch)}\n\n'
                    else:
                        yield ': heartbeat\n\n'
                    if subscriber:
                        try:
                            subscriber.get_message(timeout=1)
                        except Exception:
                            subscriber.close()
                            subscriber = None
                    else:
                        time.sleep(1)
            finally:
                if subscriber:
                    subscriber.close()
                if redis_client:
                    redis_client.close()
        response = StreamingHttpResponse(stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache, no-transform'
        response['X-Accel-Buffering'] = 'no'
        return response


@method_decorator(csrf_protect, name='dispatch')
class RepositoryFileStageView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        account = account_for(request)
        if request.data.get('context') not in {'accreditation', 'upload-documents'}:
            return Response({'detail': 'Invalid source context.'}, status=400)
        may_write(account, campus_id(request.data.get('campusId')), request.data.get('context'), {
            'frameworkId': request.data.get('frameworkId'), 'areaId': request.data.get('areaId'),
            'programId': request.data.get('programId'), 'folderId': request.data.get('folderId'),
            'sourceModule': request.data.get('context')})
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'A file is required.'}, status=400)
        stage_id = str(request.data.get('stageId') or uuid.uuid4().hex)
        if not re.fullmatch(r'[\w:.-]{8,400}',stage_id):
            return Response({'detail':'Invalid staging operation identity.'},status=400)
        key = f'{account.pk}:{stage_id}'
        file = store_file('repository-stage', key, upload.name, upload.content_type or 'application/octet-stream', upload)
        return Response({'fileRef': key, 'storageSha256': file.content_id, 'fileVersion': file.content_id,
                         'originalFileName': file.name, 'mimeType': file.mime_type, 'sizeBytes': file.content.size_bytes})


class RepositoryOriginalView(APIView):
    def get(self, request, document_id):
        account = account_for(request)
        entry = RepositoryEntry.objects.filter(kind='document', record_id=document_id, deleted=False).first()
        if not entry or not may_read(account, record(entry)):
            raise NotFound('Document is unavailable to this account.')
        data = entry.data
        file = PortalFile.objects.select_related('content').filter(source='repository-stage', key=data.get('fileRef', '')).first()
        if not file:
            files = PortalFile.objects.using(workspace_database()).select_related('content')
            file = files.filter(source=workspace_source(), key=document_id).first()
            if not file and str(data.get('documentUrl', '')).startswith('/certificates/'):
                file = files.filter(source='catalog', key=data['documentUrl'].lstrip('/')).first()
        if not file:
            file = PortalFile.objects.select_related('content').filter(source='upload', key=document_id).first()
        if not file:
            raise NotFound('The original file is missing; no placeholder was substituted.')
        if request.GET.get('preview') == '1':
            file = PortalFile.objects.select_related('content').filter(source='preview', key=file.content_id).first()
            if not file:
                raise NotFound('A preview has not been prepared.')
        from django.utils.http import content_disposition_header
        chunks = file.content.chunks.order_by('position').values_list('data', flat=True)
        response = StreamingHttpResponse((bytes(value) for value in chunks.iterator(chunk_size=4)), content_type=file.mime_type)
        response['Content-Length'] = file.content.size_bytes
        response['Content-Disposition'] = content_disposition_header(False, file.name)
        response['Cache-Control'] = 'no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        response['ETag'] = '"' + file.content_id + '"'
        return response
