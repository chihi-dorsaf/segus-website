# Generated manually to update salary field to use Tunisian Dinar (TND)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0008_restore_phone_address_birth_date_matricule'),
    ]

    operations = [
        # Mettre à jour le champ salary pour utiliser TND
        migrations.AlterField(
            model_name='employee',
            name='salary',
            field=models.DecimalField(
                blank=True,
                decimal_places=3,
                help_text='Salaire en dinars tunisiens (TND)',
                max_digits=10,
                null=True,
                verbose_name='Salaire (TND)'
            ),
        ),
    ]











