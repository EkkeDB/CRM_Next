"""
Authentication signals for automatic profile creation and security logging.
"""

from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import UserProfile, SecurityLog


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when a User is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(user_logged_in)
def log_user_login_success(sender, request, user, **kwargs):
    """Log successful login attempts"""
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    
    SecurityLog.objects.create(
        user=user,
        event_type='LOGIN_SUCCESS',
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'session_key': request.session.session_key if request and hasattr(request, 'session') else None,
            'timestamp': timezone.now().isoformat(),
        }
    )
    
    # Update user profile
    if hasattr(user, 'profile'):
        user.profile.last_login_ip = ip_address
        user.profile.last_activity = timezone.now()
        user.profile.failed_login_attempts = 0  # Reset failed attempts on success
        user.profile.save()


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if user:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
        
        SecurityLog.objects.create(
            user=user,
            event_type='LOGOUT',
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                'timestamp': timezone.now().isoformat(),
            }
        )


@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    """Log failed login attempts"""
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    username = credentials.get('username', '') if credentials else ''
    
    # Try to find the user
    user = None
    try:
        user = User.objects.get(username=username)
        if hasattr(user, 'profile'):
            user.profile.increment_failed_login_attempts()
    except User.DoesNotExist:
        pass
    
    SecurityLog.objects.create(
        user=user,
        event_type='LOGIN_FAILED',
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={
            'username': username,
            'timestamp': timezone.now().isoformat(),
        }
    )


def get_client_ip(request):
    """Get client IP address from request"""
    if request is None:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or None