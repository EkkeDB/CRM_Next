"""
Authentication views for NextCRM.
"""

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django.conf import settings

from .models import UserProfile, SecurityLog, AuditLog, Role, UserRoleAssignment
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, SecurityLogSerializer, AuditLogSerializer,
    ProfileUpdateSerializer, UserProfileSerializer, RoleSerializer, UserRoleAssignmentSerializer
)
from .policy import resolve_policy, check_allowed
from .permissions import ScopedPermission


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with security logging"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Set JWT tokens in HttpOnly cookies
            access_token = response.data['access']
            refresh_token = response.data['refresh']

            # Create new response without tokens in body
            new_response = JsonResponse({
                'message': 'Login successful',
                'user': request.user.username if hasattr(request, 'user') else None
            })

            secure = settings.AUTH_COOKIE_SECURE
            samesite = settings.AUTH_COOKIE_SAMESITE
            domain = settings.AUTH_COOKIE_DOMAIN

            # Access token cookie
            new_response.set_cookie(
                'access_token',
                access_token,
                max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite=samesite,
                path='/',
                domain=domain
            )
            # Refresh token cookie
            new_response.set_cookie(
                'refresh_token',
                refresh_token,
                max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite=samesite,
                path='/',
                domain=domain
            )

            return new_response
        
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """Custom JWT refresh view with HttpOnly cookies"""
    
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Add refresh token to request data
        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data['access']
            new_refresh = response.data.get('refresh')

            # Create new response without token in body
            new_response = JsonResponse({'message': 'Token refreshed'})

            secure = settings.AUTH_COOKIE_SECURE
            samesite = settings.AUTH_COOKIE_SAMESITE
            domain = settings.AUTH_COOKIE_DOMAIN

            # Set new access token cookie
            new_response.set_cookie(
                'access_token',
                access_token,
                max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite=samesite,
                path='/',
                domain=domain
            )
            # If refresh rotation returned a new refresh token, set it too
            if new_refresh:
                new_response.set_cookie(
                    'refresh_token',
                    new_refresh,
                    max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
                    httponly=True,
                    secure=secure,
                    samesite=samesite,
                    path='/',
                    domain=domain
                )

            return new_response
        
        return response


class RegisterView(APIView):
    """User registration view"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User created successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name='post')
class LoginView(APIView):
    """User login view with JWT tokens in HttpOnly cookies"""
    permission_classes = [AllowAny]

    @ratelimit(key='ip', rate='5/m', method='POST')
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Create response
            response = Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data
            })
            
            # Set HttpOnly cookies with proper path and domain
            secure = settings.AUTH_COOKIE_SECURE
            samesite = settings.AUTH_COOKIE_SAMESITE
            domain = settings.AUTH_COOKIE_DOMAIN

            response.set_cookie(
                'access_token',
                access_token,
                max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite=samesite,
                path='/',
                domain=domain
            )
            response.set_cookie(
                'refresh_token',
                refresh_token,
                max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
                httponly=True,
                secure=secure,
                samesite=samesite,
                path='/',
                domain=domain
            )
            
            # Update user profile activity
            if hasattr(user, 'profile'):
                user.profile.last_activity = timezone.now()
                user.profile.save()
            
            return response
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """User logout view"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Logout successful'})
        
        # Blacklist refresh token if present
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # If blacklist not available or token invalid, proceed to clear cookies
                pass

        # Clear JWT cookies with proper path
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        
        return response


class AuthZSimulateView(APIView):
    """Return resolved authorization policy for the current user or a specified user.

    Optional query params:
      - user_id: simulate for a specific user (admin/superuser only)
      - resource: e.g., contracts
      - action: e.g., read|write|export
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        target_user = request.user
        uid = request.query_params.get('user_id')
        if uid:
            if not request.user.is_superuser:
                return Response({'error': 'Only superusers can simulate other users'}, status=403)
            try:
                target_user = User.objects.get(pk=int(uid))
            except Exception:
                return Response({'error': 'user_id not found'}, status=404)

        policy = resolve_policy(target_user)
        resource = request.query_params.get('resource')
        action = request.query_params.get('action')
        decision = None
        if resource and action:
            allowed, reason = check_allowed(policy, resource, action)
            decision = {'allowed': allowed, 'reason': reason, 'resource': resource, 'action': action}

        return Response({'user_id': target_user.id, 'policy': policy, 'decision': decision})


class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Update current user profile"""
        user_data = {}
        profile_data = {}
        
        # Separate user and profile fields
        user_fields = ['first_name', 'last_name', 'email']
        for field in user_fields:
            if field in request.data:
                user_data[field] = request.data[field]
        
        # Update user fields
        if user_data:
            user_serializer = UserSerializer(request.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update profile fields
        if hasattr(request.user, 'profile'):
            profile_serializer = ProfileUpdateSerializer(
                request.user.profile, 
                data=request.data, 
                partial=True
            )
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return updated user data
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            
            # Log password change
            SecurityLog.objects.create(
                user=request.user,
                event_type='PASSWORD_CHANGE',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'timestamp': timezone.now().isoformat()}
            )
            
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Security log viewset (read-only)"""
    serializer_class = SecurityLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show logs for the current user or superuser can see all
        if self.request.user.is_superuser:
            return SecurityLog.objects.all()
        return SecurityLog.objects.filter(user=self.request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log viewset (read-only)"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only superusers can view audit logs
        if self.request.user.is_superuser:
            return AuditLog.objects.all()
        return AuditLog.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({'status': 'healthy'})


class UserViewSet(viewsets.ModelViewSet):
    """User management viewset (admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only superusers can manage users
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({'message': 'User activated successfully'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        user.is_active = False
        user.save()
        
        return Response({'message': 'User deactivated successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    """Get CSRF token for frontend"""
    return JsonResponse({'csrfToken': get_token(request)})


class RoleViewSet(viewsets.ModelViewSet):
    """Manage roles (admin only)."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Role.objects.all()
        return Role.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        # Allow partial updates even with PUT to simplify UI
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        return super().destroy(request, *args, **kwargs)


class UserRoleAssignmentViewSet(viewsets.ModelViewSet):
    """Manage role assignments (admin only)."""
    queryset = UserRoleAssignment.objects.select_related('user', 'role').all()
    serializer_class = UserRoleAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return self.queryset
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        return super().destroy(request, *args, **kwargs)


class AuthZCatalogView(APIView):
    """Return a normalized catalog of resources and actions for building RBAC matrices.

    Derives from ScopedPermission.ACTION_MAP and emits, per resource, the supported actions
    and the corresponding tokens to toggle in Role.permissions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Collect resource->raw actions from ACTION_MAP
        raw: dict[str, dict[str, dict]] = {}
        for view_name, acts in getattr(ScopedPermission, 'ACTION_MAP', {}).items():
            for action_name, (resource, action) in acts.items():
                if not resource:
                    continue
                key = 'export' if (resource == 'exports' or action == 'run') else action
                bucket = raw.setdefault(resource, {})
                entry = bucket.setdefault(key, {'usages': []})
                entry['usages'].append(f"{view_name}.{action_name}")

        # Build structured response with tokens
        resources = []
        for resource, actions in sorted(raw.items()):
            action_items = []
            for a, meta in sorted(actions.items()):
                # Token: resource:action, except export -> exports:run
                if a == 'export':
                    token = 'exports:run' if resource == 'exports' else f'{resource}:{a}'
                else:
                    token = f'{resource}:{a}'
                action_items.append({
                    'key': a,
                    'label': a.capitalize(),
                    'token': token,
                    'usages': sorted(meta.get('usages', [])),
                })
            resources.append({
                'key': resource,
                'label': resource.replace('_', ' ').title(),
                'actions': action_items,
            })

        data = {
            'resources': resources,
            'action_labels': {
                'read': 'Read',
                'write': 'Write',
                'export': 'Export',
            }
        }
        return Response(data)
