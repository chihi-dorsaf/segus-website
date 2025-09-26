# Generated migration for jobs app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="JobCategory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                ("slug", models.SlugField(max_length=100, unique=True)),
                ("icon", models.CharField(default="fas fa-briefcase", max_length=50)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Catégorie d'emploi",
                "verbose_name_plural": "Catégories d'emploi",
                "db_table": "job_categories",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="JobOffer",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(max_length=200, verbose_name="Titre du poste"),
                ),
                ("slug", models.SlugField(max_length=200, unique=True)),
                ("location", models.CharField(max_length=100, verbose_name="Lieu")),
                (
                    "job_type",
                    models.CharField(
                        choices=[
                            ("CDI", "CDI - Contrat à Durée Indéterminée"),
                            ("CDD", "CDD - Contrat à Durée Déterminée"),
                            ("Stage", "Stage"),
                            ("Freelance", "Freelance"),
                            ("Alternance", "Alternance"),
                        ],
                        max_length=20,
                        verbose_name="Type de contrat",
                    ),
                ),
                ("description", models.TextField(verbose_name="Description du poste")),
                (
                    "requirements",
                    models.JSONField(default=list, verbose_name="Exigences"),
                ),
                (
                    "skills",
                    models.JSONField(default=list, verbose_name="Compétences requises"),
                ),
                (
                    "salary_min",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                        verbose_name="Salaire minimum",
                    ),
                ),
                (
                    "salary_max",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                        verbose_name="Salaire maximum",
                    ),
                ),
                (
                    "salary_currency",
                    models.CharField(default="TND", max_length=10, verbose_name="Devise"),
                ),
                (
                    "experience_level",
                    models.CharField(
                        choices=[
                            ("Junior (0-2 ans)", "Junior (0-2 ans)"),
                            ("Confirmé (3-5 ans)", "Confirmé (3-5 ans)"),
                            ("Senior (5+ ans)", "Senior (5+ ans)"),
                            ("Expert (10+ ans)", "Expert (10+ ans)"),
                        ],
                        max_length=50,
                        verbose_name="Niveau d'expérience",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(default=True, verbose_name="Offre active"),
                ),
                (
                    "is_featured",
                    models.BooleanField(default=False, verbose_name="Offre mise en avant"),
                ),
                (
                    "application_deadline",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Date limite de candidature"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="job_offers",
                        to="jobs.jobcategory",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_job_offers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Offre d'emploi",
                "verbose_name_plural": "Offres d'emploi",
                "db_table": "job_offers",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="JobApplication",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("first_name", models.CharField(max_length=100, verbose_name="Prénom")),
                ("last_name", models.CharField(max_length=100, verbose_name="Nom")),
                (
                    "email",
                    models.EmailField(
                        max_length=254,
                        validators=[django.core.validators.EmailValidator()],
                        verbose_name="Email",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        max_length=20,
                        validators=[
                            django.core.validators.RegexValidator(
                                message="Format de téléphone invalide",
                                regex="^\\+?1?\\d{9,15}$",
                            )
                        ],
                        verbose_name="Téléphone",
                    ),
                ),
                (
                    "current_position",
                    models.CharField(blank=True, max_length=200, verbose_name="Poste actuel"),
                ),
                (
                    "experience_years",
                    models.PositiveIntegerField(verbose_name="Années d'expérience"),
                ),
                (
                    "education",
                    models.CharField(blank=True, max_length=200, verbose_name="Formation"),
                ),
                (
                    "motivation_letter",
                    models.TextField(verbose_name="Lettre de motivation"),
                ),
                (
                    "cv_file",
                    models.FileField(upload_to="applications/cvs/", verbose_name="CV"),
                ),
                (
                    "portfolio_url",
                    models.URLField(blank=True, verbose_name="Portfolio (URL)"),
                ),
                (
                    "linkedin_url",
                    models.URLField(blank=True, verbose_name="LinkedIn (URL)"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "Nouvelle"),
                            ("reviewed", "Examinée"),
                            ("interview", "Entretien"),
                            ("test", "Test technique"),
                            ("accepted", "Acceptée"),
                            ("rejected", "Rejetée"),
                            ("withdrawn", "Retirée"),
                        ],
                        default="new",
                        max_length=20,
                        verbose_name="Statut",
                    ),
                ),
                (
                    "is_spontaneous",
                    models.BooleanField(default=False, verbose_name="Candidature spontanée"),
                ),
                (
                    "admin_notes",
                    models.TextField(blank=True, verbose_name="Notes administratives"),
                ),
                (
                    "interview_date",
                    models.DateTimeField(blank=True, null=True, verbose_name="Date d'entretien"),
                ),
                (
                    "interview_notes",
                    models.TextField(blank=True, verbose_name="Notes d'entretien"),
                ),
                (
                    "applied_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Date de candidature"),
                ),
                (
                    "reviewed_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="Date d'examen"),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                (
                    "job_offer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="job_applications",
                        to="jobs.joboffer",
                        verbose_name="Offre d'emploi",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_applications",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Examiné par",
                    ),
                ),
            ],
            options={
                "verbose_name": "Candidature",
                "verbose_name_plural": "Candidatures",
                "db_table": "job_applications",
                "ordering": ["-applied_at"],
            },
        ),
        migrations.CreateModel(
            name="JobAlert",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        max_length=254,
                        validators=[django.core.validators.EmailValidator()],
                    ),
                ),
                (
                    "keywords",
                    models.CharField(blank=True, max_length=200, verbose_name="Mots-clés"),
                ),
                (
                    "job_types",
                    models.JSONField(default=list, verbose_name="Types de contrat"),
                ),
                ("locations", models.JSONField(default=list, verbose_name="Lieux")),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_sent", models.DateTimeField(blank=True, null=True)),
                (
                    "categories",
                    models.ManyToManyField(
                        blank=True, to="jobs.jobcategory", verbose_name="Catégories"
                    ),
                ),
            ],
            options={
                "verbose_name": "Alerte emploi",
                "verbose_name_plural": "Alertes emploi",
                "db_table": "job_alerts",
            },
        ),
        migrations.CreateModel(
            name="ApplicationStatusHistory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "old_status",
                    models.CharField(
                        choices=[
                            ("new", "Nouvelle"),
                            ("reviewed", "Examinée"),
                            ("interview", "Entretien"),
                            ("test", "Test technique"),
                            ("accepted", "Acceptée"),
                            ("rejected", "Rejetée"),
                            ("withdrawn", "Retirée"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "new_status",
                    models.CharField(
                        choices=[
                            ("new", "Nouvelle"),
                            ("reviewed", "Examinée"),
                            ("interview", "Entretien"),
                            ("test", "Test technique"),
                            ("accepted", "Acceptée"),
                            ("rejected", "Rejetée"),
                            ("withdrawn", "Retirée"),
                        ],
                        max_length=20,
                    ),
                ),
                ("changed_at", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="status_history",
                        to="jobs.jobapplication",
                    ),
                ),
                (
                    "changed_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Historique de statut",
                "verbose_name_plural": "Historiques de statut",
                "db_table": "application_status_history",
                "ordering": ["-changed_at"],
            },
        ),
        migrations.AddIndex(
            model_name="joboffer",
            index=models.Index(
                fields=["is_active", "-created_at"],
                name="job_offers_is_acti_4f0e4c_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="joboffer",
            index=models.Index(
                fields=["category", "is_active"], name="job_offers_categor_9f7b4a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="joboffer",
            index=models.Index(
                fields=["job_type", "is_active"], name="job_offers_job_typ_d8a1c2_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="jobapplication",
            index=models.Index(
                fields=["status", "-applied_at"], name="job_applica_status_5e2f3b_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="jobapplication",
            index=models.Index(
                fields=["job_offer", "status"], name="job_applica_job_off_8c4d1a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="jobapplication",
            index=models.Index(
                fields=["is_spontaneous", "-applied_at"],
                name="job_applica_is_spon_9a6e2f_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="jobapplication",
            index=models.Index(fields=["email"], name="job_applica_email_7b3c4d_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="jobalert",
            unique_together={("email",)},
        ),
    ]
