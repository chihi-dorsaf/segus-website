# Generated manually to restore phone, address, birth_date and matricule fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0007_alter_employee_options_remove_employee_address_and_more'),
    ]

    operations = [
        # Renommer employee_id en matricule
        migrations.RenameField(
            model_name='employee',
            old_name='employee_id',
            new_name='matricule',
        ),
        
        # Ajouter les champs manquants
        migrations.AddField(
            model_name='employee',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Téléphone'),
        ),
        
        migrations.AddField(
            model_name='employee',
            name='address',
            field=models.TextField(blank=True, null=True, verbose_name='Adresse'),
        ),
        
        migrations.AddField(
            model_name='employee',
            name='birth_date',
            field=models.DateField(blank=True, null=True, verbose_name='Date de naissance'),
        ),
    ]











