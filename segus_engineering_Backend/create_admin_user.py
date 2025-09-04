import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'segus_engineering_Backend.settings')
django.setup()
from users.models import User

email = "admin@segus-engineering.com"
password = "admin123"
if not User.objects.filter(email=email).exists():
    user = User.objects.create_superuser(
        username="admin",
        email=email,
        password=password,
        first_name="Admin",
        last_name="Segus",
        role="ADMIN"
    )
    print("✅ Admin créé :", email, password)
else:
    print("⚠️ Admin existe déjà :", email) 