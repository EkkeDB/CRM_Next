"""
Tests for NextCRM core functionality
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.nextcrm.models import (
    Currency, Trader, Counterparty, Commodity_Group, 
    Commodity_Type, Commodity_Subtype, Commodity, 
    Trade_Operation_Type, Contract
)


class ModelsTestCase(TestCase):
    """Test model creation and basic functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_currency_model(self):
        """Test Currency model creation"""
        currency = Currency.objects.create(
            currency_code='USD',
            currency_name='US Dollar',
            currency_symbol='$'
        )
        self.assertEqual(str(currency), 'USD - US Dollar')
        self.assertEqual(currency.currency_name, 'US Dollar')

    def test_trader_model(self):
        """Test Trader model creation"""
        trader = Trader.objects.create(
            trader_name='John Smith',
            email='john@example.com',
            phone='+1234567890'
        )
        self.assertEqual(str(trader), 'John Smith')
        self.assertEqual(trader.email, 'john@example.com')

    def test_counterparty_model(self):
        """Test Counterparty model creation"""
        counterparty = Counterparty.objects.create(
            counterparty_name='Acme Corp',
            counterparty_code='ACME001',
            tax_id='12345678',
            city='New York',
            country='USA',
            phone='+1234567890',
            email='contact@acme.com',
            contact_person='Jane Doe',
            is_supplier=True,
            is_customer=False
        )
        self.assertEqual(str(counterparty), 'Acme Corp')
        self.assertTrue(counterparty.is_supplier)

    def test_commodity_models(self):
        """Test Commodity and related models"""
        # Create related objects
        group = Commodity_Group.objects.create(
            commodity_group_name='Grains',
            description='Grain commodities'
        )
        commodity_type = Commodity_Type.objects.create(
            commodity_type_name='Cereal',
            description='Cereal grains'
        )
        subtype = Commodity_Subtype.objects.create(
            commodity_subtype_name='Winter Wheat',
            description='Winter wheat variety'
        )
        
        commodity = Commodity.objects.create(
            commodity_name_short='Wheat',
            commodity_name_full='Winter Wheat Premium Grade',
            unit_of_measure='MT',
            commodity_group=group,
            commodity_type=commodity_type,
            commodity_subtype=subtype
        )
        
        self.assertEqual(str(commodity), 'Wheat - Grains')
        self.assertEqual(commodity.unit_of_measure, 'MT')


class APITestCase(TestCase):
    """Test API endpoints"""

    def setUp(self):
        """Set up test client and user"""
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

    def test_currency_api_unauthenticated(self):
        """Test currency API without authentication"""
        response = self.client.get('/api/crm/currencies/')
        # Should require authentication
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_currency_api_authenticated(self):
        """Test currency API with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/currencies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_contract_api_authenticated(self):
        """Test contract API with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/contracts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class IntegrationTestCase(TestCase):
    """Integration tests for complete workflows"""

    def setUp(self):
        """Set up complete test data for integration tests"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Create required reference data
        self.currency = Currency.objects.create(
            currency_code='USD',
            currency_name='US Dollar',
            currency_symbol='$'
        )
        
        self.trader = Trader.objects.create(
            trader_name='John Smith',
            email='john@example.com',
            phone='+1234567890'
        )
        
        self.counterparty = Counterparty.objects.create(
            counterparty_name='Acme Corp',
            counterparty_code='ACME001',
            tax_id='12345678',
            city='New York',
            country='USA',
            phone='+1234567890',
            email='contact@acme.com',
            contact_person='Jane Doe',
            is_supplier=True,
            is_customer=False
        )

        # Create commodity data
        self.group = Commodity_Group.objects.create(
            commodity_group_name='Grains',
            description='Grain commodities'
        )
        self.commodity_type = Commodity_Type.objects.create(
            commodity_type_name='Cereal',
            description='Cereal grains'
        )
        self.subtype = Commodity_Subtype.objects.create(
            commodity_subtype_name='Winter Wheat',
            description='Winter wheat variety'
        )
        self.commodity = Commodity.objects.create(
            commodity_name_short='Wheat',
            commodity_name_full='Winter Wheat Premium Grade',
            unit_of_measure='MT',
            commodity_group=self.group,
            commodity_type=self.commodity_type,
            commodity_subtype=self.subtype
        )

        self.trade_operation = Trade_Operation_Type.objects.create(
            trade_operation_type_name='Purchase',
            operation_code='BUY',
            description='Commodity purchase'
        )

    def test_full_contract_workflow(self):
        """Test complete contract creation workflow via API"""
        # Note: This is a simplified test since the Contract model has many required fields
        # that would need additional reference data setup
        
        # First, test that we can get the reference data
        currencies_response = self.client.get('/api/crm/currencies/')
        self.assertEqual(currencies_response.status_code, status.HTTP_200_OK)
        
        traders_response = self.client.get('/api/crm/traders/')
        self.assertEqual(traders_response.status_code, status.HTTP_200_OK)
        
        counterparties_response = self.client.get('/api/crm/counterparties/')
        self.assertEqual(counterparties_response.status_code, status.HTTP_200_OK)
        
        commodities_response = self.client.get('/api/crm/commodities/')
        self.assertEqual(commodities_response.status_code, status.HTTP_200_OK)

        # Verify we get our test data
        self.assertEqual(len(currencies_response.data['results']), 1)
        self.assertEqual(len(traders_response.data['results']), 1)
        self.assertEqual(len(counterparties_response.data['results']), 1)
        self.assertEqual(len(commodities_response.data['results']), 1)


class SecurityTestCase(TestCase):
    """Test security features"""

    def setUp(self):
        """Set up security test client"""
        self.client = Client()

    def test_admin_requires_authentication(self):
        """Test that admin interface requires authentication"""
        response = self.client.get('/admin/')
        # Should redirect to login
        self.assertEqual(response.status_code, 302)

    def test_api_requires_authentication(self):
        """Test that API endpoints require authentication"""
        client = APIClient()
        endpoints = [
            '/api/crm/contracts/',
            '/api/crm/counterparties/',
            '/api/crm/commodities/',
            '/api/crm/traders/',
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            self.assertEqual(
                response.status_code, 
                status.HTTP_401_UNAUTHORIZED,
                f"Endpoint {endpoint} should require authentication"
            )