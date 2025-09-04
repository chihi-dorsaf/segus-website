import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()
from users.models import User
from django.db.models import Count

duplicates = User.objects.values('email').annotate(email_count=Count('id')).filter(email_count__gt=1)
total = 0
for entry in duplicates:
    email = entry['email']
    users = User.objects.filter(email=email)
    to_delete = users.exclude(id=users.first().id)
    count = to_delete.count()
    if count > 0:
        print(f"Suppression de {count} doublons pour l'email : {email}")
        total += count
        to_delete.delete()
if total == 0:
    print("Aucun doublon à supprimer.")
else:
    print(f"✅ {total} doublons supprimés.") 