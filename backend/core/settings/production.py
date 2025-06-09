"""
Production settings for NextCRM project.
"""

from .base import *
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Security Settings
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = False  # Using HTTP for development environment
SESSION_COOKIE_SECURE = False  # Using HTTP for development environment
CSRF_COOKIE_SECURE = False  # Using HTTP for development environment
SECURE_HSTS_SECONDS = 0  # Disabled for HTTP development environment
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Email configuration for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='localhost')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@nextcrm.com')

# Database optimization for production
DATABASES['default'].update({
    'CONN_MAX_AGE': 60,
    'OPTIONS': {
        'OPTIONS': '-c default_transaction_isolation=serializable'
    }
})

# Static files for production
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Sentry Error Tracking (optional)
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True
    )

# Production logging
LOGGING['handlers']['file']['level'] = 'WARNING'
LOGGING['handlers']['console']['level'] = 'ERROR'

# Cache timeout for production
CACHES['default']['TIMEOUT'] = 300  # 5 minutes

# Rate limiting enabled in production
RATELIMIT_ENABLE = True