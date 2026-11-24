from django.db import migrations


def seed(apps, schema_editor):
    default=apps.get_model('accrevia_auth','CertificateDefault')
    policy=apps.get_model('accrevia_auth','CertificatePolicy')
    entry=apps.get_model('accrevia_auth','RepositoryEntry')
    database=schema_editor.connection.alias
    initial,_=default.objects.using(database).get_or_create(campus='',framework='',area='',program='',folder='',defaults={'level':'viewer'})
    for row in entry.objects.using(database).filter(kind='document',data__docType='Certificate').iterator():
        policy.objects.using(database).get_or_create(certificate_id=row.pk,defaults={'inherited_level':'viewer','inherited_from':{'id':initial.pk,'version':initial.version}})


class Migration(migrations.Migration):
    dependencies=[('accrevia_auth','0010_repositoryaccessaudit_status_certificatedefault_and_more')]
    operations=[migrations.RunPython(seed,migrations.RunPython.noop)]
