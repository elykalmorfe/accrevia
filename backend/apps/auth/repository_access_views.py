from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .repository_views import account_for
from .repository import VersionConflict
from .repository_access import validate_scope, save_assignments, scope_token, MEMBER_ROLES
from .models import PortalAccount, RepositoryAccessAssignment, RepositoryAccessAudit


@method_decorator(csrf_protect, name='dispatch')
class RepositoryAssignmentsView(APIView):
    def scope(self, request):
        actor = account_for(request)
        if actor.role != 'Superadmin':
            raise PermissionDenied('Only the Super Admin can manage assignments.')
        return actor, validate_scope(request.query_params if request.method == 'GET' else request.data.get('scope', {}))

    def get(self, request):
        _, scope = self.scope(request)
        rows = list(RepositoryAccessAssignment.objects.filter(**scope).order_by('user_id').values('user_id', 'level', 'updated_at'))
        levels = {row['user_id']: row['level'] for row in rows}
        users = [{'id': a.pk, 'name': a.display_name(), 'email': a.email, 'role': a.role,
                  'campus': a.campus_id, 'level': levels.get(a.pk, 'none')}
                 for a in PortalAccount.objects.filter(role__in=MEMBER_ROLES, approval_status='approved', portal_status='Active').order_by('first_name', 'last_name')]
        audits = list(RepositoryAccessAudit.objects.filter(**scope).order_by('-created_at').values(
            'id', 'actor_id', 'actor_role', 'user_id', 'action', 'resource_id', 'previous_level', 'level', 'previous', 'updated', 'created_at')[:100])
        return Response({'scope': scope, 'users': users, 'version': scope_token(rows), 'history': audits})

    def post(self, request):
        actor, scope = self.scope(request)
        try:
            return Response(save_assignments(actor, scope, request.data.get('assignments'), request.data.get('version')))
        except VersionConflict as exc:
            return Response({'detail': str(exc)}, status=409)
