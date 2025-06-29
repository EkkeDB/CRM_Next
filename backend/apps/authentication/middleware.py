"""
Authentication middleware for security and audit logging.
"""

import json
import time
from django.utils import timezone
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.core.cache import cache
from .models import SecurityLog, AuditLog


class SecurityLoggingMiddleware:
    """Middleware for security event logging and rate limiting"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get client IP
        ip_address = self.get_client_ip(request)
        
        # Check for rate limiting
        if self.is_rate_limited(ip_address):
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'},
                status=429
            )
        
        # Process request
        response = self.get_response(request)
        
        # Log suspicious activity
        if self.is_suspicious_activity(request, response):
            self.log_suspicious_activity(request, response)
        
        return response

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def is_rate_limited(self, ip_address):
        """Check if IP is rate limited"""
        from django.conf import settings
        
        # Skip rate limiting if disabled in settings
        if hasattr(settings, 'RATELIMIT_ENABLE') and not settings.RATELIMIT_ENABLE:
            return False
            
        cache_key = f"rate_limit_{ip_address}"
        requests = cache.get(cache_key, 0)
        
        # Allow more requests in development
        max_requests = 500 if settings.DEBUG else 100  # 500 requests per minute in debug mode
        
        if requests >= max_requests:
            return True
        
        cache.set(cache_key, requests + 1, 60)  # 1 minute window
        return False

    def is_suspicious_activity(self, request, response):
        """Detect suspicious activity patterns"""
        # Multiple failed login attempts
        if (request.path.startswith('/api/auth/') and 
            response.status_code in [401, 403]):
            return True
        
        # SQL injection attempts
        suspicious_patterns = ['union', 'select', 'drop', 'insert', '--', ';']
        query_string = request.GET.urlencode().lower()
        if any(pattern in query_string for pattern in suspicious_patterns):
            return True
        
        return False

    def log_suspicious_activity(self, request, response):
        """Log suspicious activity"""
        user = request.user if request.user.is_authenticated else None
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        SecurityLog.objects.create(
            user=user,
            event_type='SUSPICIOUS_ACTIVITY',
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                'path': request.path,
                'method': request.method,
                'status_code': response.status_code,
                'query_params': dict(request.GET),
                'timestamp': timezone.now().isoformat(),
            }
        )


class AuditLogMiddleware:
    """Middleware for audit logging of business operations"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip audit logging for certain paths
        if self.should_skip_audit(request):
            return self.get_response(request)
        
        # Store original request data
        original_data = self.get_request_data(request)
        
        # Process request
        response = self.get_response(request)
        
        # Log audit trail for successful operations
        if (request.user.is_authenticated and 
            response.status_code in [200, 201, 204] and
            request.method in ['POST', 'PUT', 'PATCH', 'DELETE']):
            self.create_audit_log(request, response, original_data)
        
        return response

    def should_skip_audit(self, request):
        """Check if request should be skipped from audit logging"""
        skip_paths = [
            '/api/auth/login/',
            '/api/auth/logout/',
            '/api/auth/refresh/',
            '/admin/',
            '/api/docs/',
            '/api/schema/',
        ]
        return any(request.path.startswith(path) for path in skip_paths)

    def get_request_data(self, request):
        """Extract request data for audit logging"""
        try:
            if request.content_type == 'application/json':
                return json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        return dict(request.POST)

    def create_audit_log(self, request, response, original_data):
        """Create audit log entry"""
        user = request.user
        ip_address = self.get_client_ip(request)
        
        # Determine action
        action_map = {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        }
        action = action_map.get(request.method, 'VIEW')
        
        # Extract model information from path
        path_parts = request.path.strip('/').split('/')
        model_name = 'Unknown'
        object_id = ''
        
        if len(path_parts) >= 3:
            model_name = path_parts[2].title()  # e.g., 'contracts' -> 'Contracts'
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                object_id = path_parts[3]
        
        # Create audit log
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            object_repr=f"{model_name} {object_id}" if object_id else model_name,
            changes=original_data,
            ip_address=ip_address,
        )

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip