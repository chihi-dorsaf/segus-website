# Test settings for Django project
from datetime import timedelta
from segus_engineering_Backend.settings import *  # noqa: F403,F405

# Override settings for testing
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
    }
}

# Ensure every configured database alias defines ATOMIC_REQUESTS to avoid KeyError in tests
for _db_alias, _db_cfg in DATABASES.items():
    if "ATOMIC_REQUESTS" not in _db_cfg:
        _db_cfg["ATOMIC_REQUESTS"] = False


# Enable real migrations during tests so required tables are created

# Speed up password hashing for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Disable logging during tests
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "null": {
            "class": "logging.NullHandler",
        },
    },
    "root": {
        "handlers": ["null"],
    },
}

# Email backend for testing
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Disable CORS for tests
CORS_ALLOW_ALL_ORIGINS = True

# Media files for tests
MEDIA_ROOT = "/tmp/test_media/"

# Static files for tests
STATIC_ROOT = "/tmp/test_static/"

# Disable debug toolbar and other dev tools
DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

# Test cache
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Disable channels for tests
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "channels"]  # noqa: F405

# Simple JWT settings for tests
SIMPLE_JWT.update(  # noqa: F405
    {
        "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
        "REFRESH_TOKEN_LIFETIME": timedelta(minutes=10),
    }
)
