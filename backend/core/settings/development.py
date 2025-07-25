"""
Development settings for NextCRM project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'backend', 'nextcrm_backend']

# Development specific apps
INSTALLED_APPS += [
    'debug_toolbar',
]

# Development specific middleware
MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug Toolbar Configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Development database
DATABASES['default'].update({
    'HOST': 'postgres',
})

# Disable HTTPS for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = False  # Use specific origins for better security
CORS_ALLOW_CREDENTIALS = True

# Development CORS origins (extends base.py settings)
CORS_ALLOWED_ORIGINS += [
    "http://frontend:3000",  # Docker service name
    "http://nextcrm_frontend:3000",  # Container name
]

# Additional development-specific CORS regex patterns
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
    r"^http://0\.0\.0\.0:\d+$",
    r"^http://frontend:\d+$",
    r"^http://nextcrm_frontend:\d+$",
]

# Preflight OPTIONS request settings
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

CORS_EXPOSE_HEADERS = [
    'x-csrftoken',
]

# CSRF trusted origins for development (extends base.py)
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://frontend:3000',  # Docker service name
    'http://nextcrm_frontend:3000',  # Container name
    'http://backend:8000',  # Backend service name
    'http://nextcrm_backend:8000',  # Backend container name
]

# Additional CSRF settings for development
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access in dev
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = False  # Use cookies instead of sessions
CSRF_COOKIE_AGE = 31449600  # 1 year

# Logging for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'

# Disable rate limiting in development
RATELIMIT_ENABLE = False