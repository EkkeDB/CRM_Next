"""
URL configuration for authentication API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, RegisterView, UserProfileView,
    ChangePasswordView, SecurityLogViewSet, AuditLogViewSet,
    UserViewSet, me, health_check, CustomTokenObtainPairView,
    CustomTokenRefreshView
)

router = DefaultRouter()
router.register(r'security-logs', SecurityLogViewSet, basename='security-logs')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'users', UserViewSet)

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('me/', me, name='me'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Utility endpoints
    path('health/', health_check, name='health_check'),
    
    # Include router URLs
    path('', include(router.urls)),
]