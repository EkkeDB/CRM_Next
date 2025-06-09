"""
Authentication serializers for NextCRM.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import UserProfile, SecurityLog, AuditLog


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'company', 'position', 'timezone',
            'is_mfa_enabled', 'gdpr_consent', 'gdpr_consent_date',
            'created_at', 'updated_at', 'last_activity'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_activity']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    # Profile fields
    phone = serializers.CharField(max_length=17, required=False, allow_blank=True)
    company = serializers.CharField(max_length=100, required=False, allow_blank=True)
    position = serializers.CharField(max_length=100, required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=50, default='UTC')
    gdpr_consent = serializers.BooleanField(required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company',
            'position', 'timezone', 'gdpr_consent'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password fields do not match.'
            })
        
        if not attrs.get('gdpr_consent'):
            raise serializers.ValidationError({
                'gdpr_consent': 'GDPR consent is required.'
            })
        
        return attrs

    def create(self, validated_data):
        # Remove password_confirm and profile fields
        validated_data.pop('password_confirm', None)
        profile_data = {
            'phone': validated_data.pop('phone', ''),
            'company': validated_data.pop('company', ''),
            'position': validated_data.pop('position', ''),
            'timezone': validated_data.pop('timezone', 'UTC'),
            'gdpr_consent': validated_data.pop('gdpr_consent', False),
        }
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Update profile (created by signal)
        if hasattr(user, 'profile'):
            for key, value in profile_data.items():
                setattr(user.profile, key, value)
            if profile_data['gdpr_consent']:
                from django.utils import timezone
                user.profile.gdpr_consent_date = timezone.now()
            user.profile.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Unable to login with provided credentials.'
                )
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            # Check if account is locked
            if hasattr(user, 'profile') and user.profile.is_account_locked():
                raise serializers.ValidationError(
                    'Account is temporarily locked due to failed login attempts.'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include username and password.'
            )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'New password fields do not match.'
            })
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Invalid old password.')
        return value


class SecurityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SecurityLog
        fields = [
            'id', 'username', 'event_type', 'ip_address',
            'user_agent', 'metadata', 'timestamp'
        ]
        read_only_fields = ['id', 'username', 'timestamp']


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'username', 'action', 'model_name', 'object_id',
            'object_repr', 'changes', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'username', 'timestamp']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'company', 'position', 'timezone', 'is_mfa_enabled'
        ]
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance