"""
Django admin configuration for authentication models.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, SecurityLog, AuditLog


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    readonly_fields = ('created_at', 'updated_at', 'last_activity', 'last_login_ip')


class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_last_login_ip')
    list_filter = UserAdmin.list_filter + ('profile__is_mfa_enabled',)
    
    def get_last_login_ip(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.last_login_ip
        return None
    get_last_login_ip.short_description = 'Last Login IP'


@admin.register(SecurityLog)
class SecurityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'event_type', 'user', 'ip_address')
    list_filter = ('event_type', 'timestamp')
    search_fields = ('user__username', 'ip_address', 'user_agent')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'model_name', 'user', 'object_repr')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__username', 'object_repr', 'model_name')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)