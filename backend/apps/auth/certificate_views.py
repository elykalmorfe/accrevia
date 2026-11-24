from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from .repository_views import account_for
from .models import PortalAccount, RepositoryEntry, CertificateDefault, RepositoryAccessAudit
from .repository import record, VersionConflict
from .certificate_access import ensure_policy, is_certificate, preview, update_access, update_default


def superadmin(request):
    actor=account_for(request)
    if actor.role!='Superadmin': raise PermissionDenied('Only the Super Admin can manage certificate access.')
    return actor


@method_decorator(csrf_protect,name='dispatch')
class CertificateAccessView(APIView):
    def get(self,request):
        superadmin(request)
        entry=RepositoryEntry.objects.filter(kind='document',record_id=request.GET.get('id'),deleted=False).first()
        if not entry or not is_certificate(entry.data): raise NotFound('Certificate not found.')
        policy=ensure_policy(entry)
        users=[]
        grants={g.user_id:g for g in policy.grants.all()}
        for user in PortalAccount.objects.filter(role__in=['Faculty','Staff'],approval_status='approved',portal_status='Active').order_by('name','email'):
            grant=grants.get(user.pk)
            users.append({'id':user.pk,'name':user.display_name(),'role':user.role,'campus':user.campus_id,'office':user.office,'email':user.email,
                          'level':grant.level if grant else 'reset','allowCrossCampus':grant.allow_cross_campus if grant else False})
        audits=list(RepositoryAccessAudit.objects.filter(resource_id=entry.record_id).order_by('-created_at').values()[:100])
        return Response({'certificate':record(entry),'general':policy.general,'allowCrossCampus':policy.allow_cross_campus,
            'inheritedLevel':policy.inherited_level,'inheritedFrom':policy.inherited_from,'updatedAt':policy.updated_at,'lastModifiedAt':entry.updated_at,
            'users':users,'preview':preview({'ids':[entry.record_id]}),'history':audits})

    def post(self,request):
        actor=superadmin(request)
        try: return Response(update_access(actor,request.data))
        except VersionConflict as exc: return Response({'detail':str(exc)},status=409)


@method_decorator(csrf_protect,name='dispatch')
class CertificatePreviewView(APIView):
    def post(self,request):
        superadmin(request)
        return Response(preview(request.data.get('selection') or {}))


@method_decorator(csrf_protect,name='dispatch')
class CertificateDefaultsView(APIView):
    def get(self,request):
        superadmin(request)
        users=[{'id':user.pk,'name':user.display_name(),'role':user.role,'campus':user.campus_id,'office':user.office,'email':user.email,'level':'reset','allowCrossCampus':False}
               for user in PortalAccount.objects.filter(role__in=['Faculty','Staff'],approval_status='approved',portal_status='Active')]
        return Response({'defaults':list(CertificateDefault.objects.values()),'users':users})

    def post(self,request):
        actor=superadmin(request)
        try: return Response(update_default(actor,request.data))
        except VersionConflict as exc: return Response({'detail':str(exc)},status=409)
