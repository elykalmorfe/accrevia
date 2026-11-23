from django.db import migrations


def seed(apps, schema_editor):
    model = apps.get_model('accrevia_auth', 'RepositoryAreaDefinition')
    names = {
        'ia': ['Governance and Management', 'Teaching, Learning, and Evaluation', 'Faculty and Staff', 'Research', 'Extension, Consultancy, and Linkages', 'Support to Students', 'Library', 'Infrastructure and Other Learning Resources', 'Quality Assurance Culture'],
        'pa': ['Vision, Mission, Goals and Objectives', 'Faculty', 'Curriculum and Instruction', 'Support to Students', 'Research', 'Extension and Community Involvement', 'Library', 'Physical Plant and Facilities', 'Laboratories', 'Administration'],
        'pqa': ['Leadership', 'Strategy', 'Customers & Students', 'Measurement & Knowledge Management', 'Workforce', 'Operations', 'Results'],
    }
    roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix']
    for framework, areas in names.items():
        for i, name in enumerate(areas, 1):
            code = 'area-' + roman[i-1] if framework == 'ia' else ('pqa-' if framework == 'pqa' else 'area-') + str(i)
            model.objects.using(schema_editor.connection.alias).get_or_create(framework=framework, code=code, defaults={'name': name, 'position': i})


class Migration(migrations.Migration):
    dependencies = [('accrevia_auth', '0008_repositoryareadefinition_and_more')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
