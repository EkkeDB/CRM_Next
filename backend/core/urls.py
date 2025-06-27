"""
NextCRM URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

def ping_view(request):
    """Simple ping endpoint for connectivity testing"""
    return JsonResponse({
        'status': 'ok',
        'message': 'NextCRM Backend is running',
        'version': '1.0.0'
    })

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Ping endpoint for connectivity testing
    path('ping/', ping_view, name='ping'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/crm/', include('apps.nextcrm.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns

# Admin site configuration
admin.site.site_header = 'NextCRM Administration'
admin.site.site_title = 'NextCRM Admin'
admin.site.index_title = 'Welcome to NextCRM Administration'