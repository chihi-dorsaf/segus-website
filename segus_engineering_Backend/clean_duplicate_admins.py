import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "segus_engineering_Backend.settings")
django.setup()
from users.models import User  # noqa: E402

dups = User.objects.filter(email="admin@segus-engineering.com")
if dups.count() > 1:
    print(f"Suppression de {dups.count() - 1} doublons...")
    dups.exclude(id=dups.first().id).delete()
    print("✅ Doublons supprimés")
else:
    print("Aucun doublon à supprimer")
