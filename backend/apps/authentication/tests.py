"""
Tests for authentication functionality
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import UserProfile, SecurityLog, AuditLog


class UserProfileTestCase(TestCase):
    """Test UserProfile model and signal functionality"""

    def test_user_profile_creation(self):
        """Test that UserProfile is created when User is created"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # UserProfile should be created automatically via signal
        self.assertTrue(hasattr(user, 'profile'))
        profile = user.profile
        self.assertEqual(profile.user, user)
        self.assertEqual(profile.timezone, 'UTC')
        self.assertFalse(profile.is_mfa_enabled)

    def test_user_profile_str_method(self):
        """Test UserProfile string representation"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        profile = user.profile
        self.assertEqual(str(profile), f"{user.username} - ")


class SecurityLogTestCase(TestCase):
    """Test SecurityLog model"""

    def setUp(self):
        """Set up test user"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_security_log_creation(self):
        """Test SecurityLog creation"""
        log = SecurityLog.objects.create(
            user=self.user,
            event_type='LOGIN_SUCCESS',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            metadata={'test': 'data'}
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.event_type, 'LOGIN_SUCCESS')
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertEqual(log.metadata['test'], 'data')

    def test_security_log_str_method(self):
        """Test SecurityLog string representation"""
        log = SecurityLog.objects.create(
            user=self.user,
            event_type='LOGIN_FAILED',
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            metadata={}
        )
        
        # Check that the string representation includes the key components
        log_str = str(log)
        self.assertIn('LOGIN_FAILED', log_str)
        self.assertIn(self.user.username, log_str)


class AuditLogTestCase(TestCase):
    """Test AuditLog model"""

    def setUp(self):
        """Set up test user"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_audit_log_creation(self):
        """Test AuditLog creation"""
        log = AuditLog.objects.create(
            user=self.user,
            action='CREATE',
            model_name='Contract',
            object_id='123',
            object_repr='Test Contract',
            changes={'field': 'value'},
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, 'CREATE')
        self.assertEqual(log.model_name, 'Contract')
        self.assertEqual(log.changes['field'], 'value')

    def test_audit_log_str_method(self):
        """Test AuditLog string representation"""
        log = AuditLog.objects.create(
            user=self.user,
            action='UPDATE',
            model_name='Contract',
            object_id='123',
            object_repr='Test Contract',
            changes={},
            ip_address='127.0.0.1'
        )
        
        # Check that the string representation includes the key components
        log_str = str(log)
        self.assertIn('UPDATE', log_str)
        self.assertIn('Contract', log_str)
        self.assertIn(self.user.username, log_str)


class AuthenticationAPITestCase(TestCase):
    """Test authentication API endpoints"""

    def setUp(self):
        """Set up test client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get('/api/auth/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')

    def test_user_profile_endpoint_unauthenticated(self):
        """Test user profile endpoint without authentication"""
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_endpoint_authenticated(self):
        """Test user profile endpoint with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_security_logs_endpoint_authenticated(self):
        """Test security logs endpoint with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/security-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audit_logs_endpoint_authenticated(self):
        """Test audit logs endpoint with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)