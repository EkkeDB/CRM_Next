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
    Trade_Operation_Type, Contract, Contact, Deal, DealLine
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
        """Test Commodity and related models (de-nested taxonomy)"""
        group = Commodity_Group.objects.create(
            commodity_group_name='Grains',
            description='Grain commodities'
        )
        ctype = Commodity_Type.objects.create(
            commodity_type_name='Cereal',
            description='Cereal grains'
        )
        subtype = Commodity_Subtype.objects.create(
            commodity_subtype_name='Winter Wheat',
            description='Winter wheat variety',
        )

        commodity = Commodity.objects.create(
            commodity_name_short='Wheat',
            commodity_name_full='Winter Wheat Premium Grade',
            unit_of_measure='MT',
            commodity_group=group,
            commodity_type=ctype,
            commodity_subtype=subtype,
        )

        self.assertEqual(str(commodity), 'Wheat')
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
        response = self.client.get('/api/currencies/')
        # Should require authentication
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_currency_api_authenticated(self):
        """Test currency API with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/currencies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_contract_api_authenticated(self):
        """Test contract API with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/contracts/')
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
        currencies_response = self.client.get('/api/currencies/')
        self.assertEqual(currencies_response.status_code, status.HTTP_200_OK)
        
        traders_response = self.client.get('/api/traders/')
        self.assertEqual(traders_response.status_code, status.HTTP_200_OK)
        
        counterparties_response = self.client.get('/api/counterparties/')
        self.assertEqual(counterparties_response.status_code, status.HTTP_200_OK)
        
        commodities_response = self.client.get('/api/commodities/')
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


class ContactAPITestCase(TestCase):
    """Test Contacts API endpoints and model behavior"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Create a counterparty to link contacts to
        self.counterparty = Counterparty.objects.create(
            counterparty_name='Beta Trading Co',
            counterparty_code='BETA001',
            is_supplier=True,
            is_customer=True,
        )

    def test_contacts_crud(self):
        # Create
        payload = {
            'name': 'Alice Johnson',
            'email': 'alice@beta.com',
            'phone': '+1-555-0100',
            'position': 'Buyer',
            'city': 'NYC',
            'country': 'USA',
            'status': 'lead',
            'source': 'Website',
            'notes': 'Important lead',
            'counterparty': self.counterparty.id,
        }
        create_resp = self.client.post('/api/contacts/', payload, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        contact_id = create_resp.data['id']

        # List
        list_resp = self.client.get('/api/contacts/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any(c['id'] == contact_id for c in list_resp.data['results'] if 'results' in list_resp.data or isinstance(list_resp.data, list)))

        # Retrieve
        detail_resp = self.client.get(f'/api/contacts/{contact_id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_resp.data['company'], self.counterparty.counterparty_name)

        # Update
        update_resp = self.client.patch(
            f'/api/contacts/{contact_id}/',
            { 'status': 'active' },
            format='json'
        )
        self.assertEqual(update_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(update_resp.data['status'], 'active')

        # Delete
        delete_resp = self.client.delete(f'/api/contacts/{contact_id}/')
        self.assertEqual(delete_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(f'/api/contacts/{contact_id}/').status_code, status.HTTP_404_NOT_FOUND)


class DealAPITestCase(TestCase):
    """Test Deals API endpoints and materialization behavior"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Minimal reference data for a deal
        self.currency = Currency.objects.create(currency_code='USD', currency_name='US Dollar', currency_symbol='$')
        self.trader = Trader.objects.create(trader_name='John Smith', email='john@example.com')
        self.counterparty = Counterparty.objects.create(counterparty_name='Acme Corp', is_supplier=True, is_customer=True)
        group = Commodity_Group.objects.create(commodity_group_name='Grains')
        ctype = Commodity_Type.objects.create(commodity_type_name='Cereal')
        subtype = Commodity_Subtype.objects.create(commodity_subtype_name='Wheat')
        self.commodity = Commodity.objects.create(commodity_name_short='Wheat', commodity_subtype=subtype)

        from apps.nextcrm.models import Delivery_Format, Additive, Broker, ICOTERM, Sociedad, Cost_Center
        self.delivery_format = Delivery_Format.objects.create(delivery_format_name='Bulk Vessel', delivery_format_cost=10)
        self.additive = Additive.objects.create(additive_name='Location Differential', additive_cost=5)
        self.broker = Broker.objects.create(broker_name='Best Brokers')
        self.icoterm = ICOTERM.objects.create(icoterm_name='Free on Board', icoterm_code='FOB')
        self.sociedad = Sociedad.objects.create(sociedad_name='NextCRM Trading LLC')
        self.cost_center = Cost_Center.objects.create(cost_center_name='Trading Operations')
        self.optype = Trade_Operation_Type.objects.create(trade_operation_type_name='Sale', operation_code='SELL', price_type='FLAT', side='SELL')

    def test_create_deal_and_generate_contracts(self):
        from datetime import date
        # Create a deal with 3 non-consecutive lines
        payload = {
            'trader': self.trader.id,
            'trade_operation_type': self.optype.id,
            'sociedad': self.sociedad.id,
            'counterparty': self.counterparty.id,
            'commodity': self.commodity.id,
            'delivery_format': self.delivery_format.id,
            'additive': self.additive.id,
            'broker': self.broker.id,
            'icoterm': self.icoterm.id,
            'cost_center': self.cost_center.id,
            'broker_fee': '2.50',
            'broker_fee_currency': self.currency.id,
            'freight_cost': '5.00',
            'forex': '1.0000',
            'price': '1300.00',
            'trade_currency': self.currency.id,
            'payment_days': 30,
            'unit_of_measure': 'MT',
            'entrega': 'Rotterdam',
            'date': str(date.today()),
            'status': 'draft',
            'notes': 'Test deal',
            'lines': [
                { 'delivery_period_start': '2025-03-01', 'delivery_period_end': '2025-03-31', 'quantity': '100.000' },
                { 'delivery_period_start': '2025-06-01', 'delivery_period_end': '2025-06-30', 'quantity': '100.000' },
                { 'delivery_period_start': '2025-12-01', 'delivery_period_end': '2025-12-31', 'quantity': '100.000' },
            ]
        }

        create_resp = self.client.post('/api/deals/', payload, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        deal_id = create_resp.data['id']

        # Generate contracts
        gen_resp = self.client.post(f'/api/deals/{deal_id}/generate_contracts/')
        self.assertEqual(gen_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(gen_resp.data['generated'], 3)

        # Verify contracts linked to deal
        contracts = Contract.objects.filter(deal_id=deal_id)
        self.assertEqual(contracts.count(), 3)

        # Re-run generate is idempotent
        gen_resp2 = self.client.post(f'/api/deals/{deal_id}/generate_contracts/')
        self.assertEqual(gen_resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(gen_resp2.data['generated'], 0)

    def test_update_deal_propagates_to_children(self):
        from datetime import date
        # Create a deal with 2 lines and generate
        payload = {
            'trader': self.trader.id,
            'trade_operation_type': self.optype.id,
            'sociedad': self.sociedad.id,
            'counterparty': self.counterparty.id,
            'commodity': self.commodity.id,
            'delivery_format': self.delivery_format.id,
            'additive': self.additive.id,
            'broker': self.broker.id,
            'icoterm': self.icoterm.id,
            'cost_center': self.cost_center.id,
            'broker_fee': '2.50',
            'broker_fee_currency': self.currency.id,
            'freight_cost': '5.00',
            'forex': '1.0000',
            'price': '1300.00',
            'trade_currency': self.currency.id,
            'payment_days': 30,
            'unit_of_measure': 'MT',
            'entrega': 'Rotterdam',
            'date': str(date.today()),
            'status': 'draft',
            'notes': 'Test deal',
            'lines': [
                { 'delivery_period_start': '2025-03-01', 'delivery_period_end': '2025-03-31', 'quantity': '100.000' },
                { 'delivery_period_start': '2025-06-01', 'delivery_period_end': '2025-06-30', 'quantity': '100.000' },
            ]
        }
        create_resp = self.client.post('/api/deals/', payload, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        deal_id = create_resp.data['id']

        gen_resp = self.client.post(f'/api/deals/{deal_id}/generate_contracts/')
        self.assertEqual(gen_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(gen_resp.data['generated'], 2)

        # Mark one child as executed; it should not be updated by propagation
        contracts = list(Contract.objects.filter(deal_id=deal_id).order_by('id'))
        contracts[0].status = 'executed'
        contracts[0].save()

        # Update deal header (price, broker_fee) with default propagate=true
        upd_resp = self.client.patch(
            f'/api/deals/{deal_id}/',
            { 'price': '1400.00', 'broker_fee': '3.00' },
            format='json'
        )
        self.assertEqual(upd_resp.status_code, status.HTTP_200_OK)

        refreshed = list(Contract.objects.filter(deal_id=deal_id).order_by('id'))
        self.assertEqual(str(refreshed[0].price), '1300.00')  # executed contract unchanged
        self.assertEqual(str(refreshed[1].price), '1400.00')  # non-executed updated

    def test_contract_override_fields_blocks_propagation(self):
        from datetime import date
        # Create deal and generate 1 contract
        payload = {
            'trader': self.trader.id,
            'trade_operation_type': self.optype.id,
            'sociedad': self.sociedad.id,
            'counterparty': self.counterparty.id,
            'commodity': self.commodity.id,
            'delivery_format': self.delivery_format.id,
            'additive': self.additive.id,
            'broker': self.broker.id,
            'icoterm': self.icoterm.id,
            'cost_center': self.cost_center.id,
            'broker_fee': '2.50',
            'broker_fee_currency': self.currency.id,
            'freight_cost': '5.00',
            'forex': '1.0000',
            'price': '1300.00',
            'trade_currency': self.currency.id,
            'payment_days': 30,
            'unit_of_measure': 'MT',
            'entrega': 'Rotterdam',
            'date': str(date.today()),
            'status': 'draft',
            'notes': 'Test deal',
            'lines': [
                { 'delivery_period_start': '2025-03-01', 'delivery_period_end': '2025-03-31', 'quantity': '100.000' },
            ]
        }
        deal_resp = self.client.post('/api/deals/', payload, format='json')
        self.assertEqual(deal_resp.status_code, status.HTTP_201_CREATED)
        deal_id = deal_resp.data['id']
        self.client.post(f'/api/deals/{deal_id}/generate_contracts/')
        contract = Contract.objects.get(deal_id=deal_id)

        # Change price on contract -> should mark override_fields and keep sticky
        upd_contract = self.client.patch(f'/api/contracts/{contract.id}/', { 'price': '1500.00' }, format='json')
        self.assertEqual(upd_contract.status_code, status.HTTP_200_OK)
        contract.refresh_from_db()
        self.assertIn('price', contract.override_fields)
        self.assertEqual(str(contract.price), '1500.00')

        # Update deal price -> contract price remains 1500.00 due to override
        upd_deal = self.client.patch(f'/api/deals/{deal_id}/', { 'price': '1400.00' }, format='json')
        self.assertEqual(upd_deal.status_code, status.HTTP_200_OK)
        contract.refresh_from_db()
        self.assertEqual(str(contract.price), '1500.00')
