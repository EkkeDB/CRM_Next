"""
Management command to populate reference data for NextCRM.
This command creates initial data for all reference tables.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.nextcrm.models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type, 
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM, 
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type
)


class Command(BaseCommand):
    help = 'Populate reference data for NextCRM'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting reference data population...'))
        
        with transaction.atomic():
            self.create_currencies()
            self.create_cost_centers()
            self.create_traders()
            self.create_commodity_groups()
            self.create_commodity_types()
            self.create_commodity_subtypes()
            self.create_commodities()
            self.create_counterparties()
            self.create_brokers()
            self.create_icoterms()
            self.create_delivery_formats()
            self.create_additives()
            self.create_sociedades()
            self.create_trade_operation_types()
        
        self.stdout.write(self.style.SUCCESS('Reference data population completed successfully!'))

    def create_currencies(self):
        currencies_data = [
            {'currency_code': 'USD', 'currency_name': 'US Dollar', 'currency_symbol': '$'},
            {'currency_code': 'EUR', 'currency_name': 'Euro', 'currency_symbol': '€'},
            {'currency_code': 'GBP', 'currency_name': 'British Pound', 'currency_symbol': '£'},
            {'currency_code': 'JPY', 'currency_name': 'Japanese Yen', 'currency_symbol': '¥'},
            {'currency_code': 'CAD', 'currency_name': 'Canadian Dollar', 'currency_symbol': 'C$'},
            {'currency_code': 'AUD', 'currency_name': 'Australian Dollar', 'currency_symbol': 'A$'},
            {'currency_code': 'CHF', 'currency_name': 'Swiss Franc', 'currency_symbol': 'CHF'},
            {'currency_code': 'CNY', 'currency_name': 'Chinese Yuan', 'currency_symbol': '¥'},
            {'currency_code': 'BRL', 'currency_name': 'Brazilian Real', 'currency_symbol': 'R$'},
            {'currency_code': 'INR', 'currency_name': 'Indian Rupee', 'currency_symbol': '₹'},
        ]
        
        for data in currencies_data:
            Currency.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(currencies_data)} currencies')

    def create_cost_centers(self):
        cost_centers_data = [
            {'cost_center_name': 'Trading Operations', 'description': 'Primary trading operations center'},
            {'cost_center_name': 'Risk Management', 'description': 'Risk management and compliance'},
            {'cost_center_name': 'Logistics', 'description': 'Shipping and logistics operations'},
            {'cost_center_name': 'Finance', 'description': 'Financial operations and accounting'},
            {'cost_center_name': 'Administration', 'description': 'General administration'},
        ]
        
        for data in cost_centers_data:
            Cost_Center.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(cost_centers_data)} cost centers')

    def create_traders(self):
        traders_data = [
            {'trader_name': 'John Smith', 'email': 'john.smith@company.com', 'phone': '+1-555-0101'},
            {'trader_name': 'Sarah Johnson', 'email': 'sarah.johnson@company.com', 'phone': '+1-555-0102'},
            {'trader_name': 'Michael Brown', 'email': 'michael.brown@company.com', 'phone': '+1-555-0103'},
            {'trader_name': 'Emily Davis', 'email': 'emily.davis@company.com', 'phone': '+1-555-0104'},
            {'trader_name': 'David Wilson', 'email': 'david.wilson@company.com', 'phone': '+1-555-0105'},
        ]
        
        for data in traders_data:
            Trader.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(traders_data)} traders')

    def create_commodity_groups(self):
        groups_data = [
            {'commodity_group_name': 'Grains', 'description': 'Cereal grains and grain products'},
            {'commodity_group_name': 'Energy', 'description': 'Oil, gas, and energy products'},
            {'commodity_group_name': 'Metals', 'description': 'Precious and base metals'},
            {'commodity_group_name': 'Soft Commodities', 'description': 'Coffee, sugar, cocoa, cotton'},
            {'commodity_group_name': 'Livestock', 'description': 'Cattle, hogs, and poultry'},
            {'commodity_group_name': 'Oilseeds', 'description': 'Soybeans, canola, sunflower seeds'},
        ]
        
        for data in groups_data:
            Commodity_Group.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(groups_data)} commodity groups')

    def create_commodity_types(self):
        # Get commodity groups to assign relationships
        groups = list(Commodity_Group.objects.all())
        
        if not groups:
            self.stdout.write(self.style.WARNING('Cannot create commodity types without commodity groups'))
            return
        
        types_data = [
            {'commodity_type_name': 'Wheat', 'commodity_group': groups[0], 'description': 'Various types of wheat'},
            {'commodity_type_name': 'Corn', 'commodity_group': groups[0], 'description': 'Corn and corn products'},
            {'commodity_type_name': 'Crude Oil', 'commodity_group': groups[1], 'description': 'Crude oil products'},
            {'commodity_type_name': 'Gold', 'commodity_group': groups[2], 'description': 'Gold and gold products'},
            {'commodity_type_name': 'Coffee', 'commodity_group': groups[3], 'description': 'Coffee beans and products'},
            {'commodity_type_name': 'Soybeans', 'commodity_group': groups[5], 'description': 'Soybean varieties'},
        ]
        
        for data in types_data:
            Commodity_Type.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(types_data)} commodity types')

    def create_commodity_subtypes(self):
        # Get commodity types to assign relationships
        types = list(Commodity_Type.objects.all())
        
        if not types:
            self.stdout.write(self.style.WARNING('Cannot create commodity subtypes without commodity types'))
            return
        
        subtypes_data = [
            {'commodity_subtype_name': 'Hard Red Winter', 'commodity_type': types[0], 'description': 'Hard red winter wheat'},
            {'commodity_subtype_name': 'Yellow Corn', 'commodity_type': types[1], 'description': 'Standard yellow corn'},
            {'commodity_subtype_name': 'WTI', 'commodity_type': types[2], 'description': 'West Texas Intermediate crude oil'},
            {'commodity_subtype_name': 'Fine Gold', 'commodity_type': types[3], 'description': '99.9% pure gold'},
            {'commodity_subtype_name': 'Arabica', 'commodity_type': types[4], 'description': 'Arabica coffee beans'},
            {'commodity_subtype_name': 'No. 1 Yellow', 'commodity_type': types[5], 'description': 'No. 1 yellow soybeans'},
        ]
        
        for data in subtypes_data:
            Commodity_Subtype.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(subtypes_data)} commodity subtypes')

    def create_commodities(self):
        # Get commodity subtypes to assign relationships
        subtypes = list(Commodity_Subtype.objects.all())
        
        if not subtypes:
            self.stdout.write(self.style.WARNING('Cannot create commodities without commodity subtypes'))
            return
        
        commodities_data = [
            {
                'commodity_name_short': 'HRW',
                'commodity_name_full': 'Hard Red Winter Wheat',
                'commodity_subtype': subtypes[0],  # Hard Red Winter
                'unit_of_measure': 'MT'
            },
            {
                'commodity_name_short': 'CORN',
                'commodity_name_full': 'Yellow Corn',
                'commodity_subtype': subtypes[1],  # Yellow Corn
                'unit_of_measure': 'MT'
            },
            {
                'commodity_name_short': 'WTI',
                'commodity_name_full': 'West Texas Intermediate Crude Oil',
                'commodity_subtype': subtypes[2],  # WTI
                'unit_of_measure': 'BBL'
            },
        ]
        
        for data in commodities_data:
            Commodity.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(commodities_data)} commodities')

    def create_counterparties(self):
        counterparties_data = [
            {
                'counterparty_name': 'Acme Trading Corp',
                'counterparty_code': 'ACME001',
                'tax_id': 'TAX123456789',
                'city': 'New York',
                'country': 'USA',
                'phone': '+1-555-1001',
                'email': 'contact@acmetrading.com',
                'contact_person': 'Robert Johnson',
                'is_supplier': True,
                'is_customer': False
            },
            {
                'counterparty_name': 'Global Commodities Ltd',
                'counterparty_code': 'GCL001',
                'tax_id': 'TAX987654321',
                'city': 'London',
                'country': 'UK',
                'phone': '+44-20-7123-4567',
                'email': 'info@globalcommodities.co.uk',
                'contact_person': 'Margaret Smith',
                'is_supplier': False,
                'is_customer': True
            },
            {
                'counterparty_name': 'Continental Resources',
                'counterparty_code': 'CONT001',
                'tax_id': 'TAX555666777',
                'city': 'Chicago',
                'country': 'USA',
                'phone': '+1-312-555-2001',
                'email': 'trading@continental.com',
                'contact_person': 'James Wilson',
                'is_supplier': True,
                'is_customer': True
            },
        ]
        
        for data in counterparties_data:
            Counterparty.objects.get_or_create(
                counterparty_code=data['counterparty_code'],
                defaults=data
            )
        
        self.stdout.write(f'Created {len(counterparties_data)} counterparties')

    def create_brokers(self):
        brokers_data = [
            {
                'broker_name': 'First Brokerage Inc',
                'broker_code': 'FBI001',
                'contact_person': 'Tom Anderson',
                'email': 'tom@firstbrokerage.com',
                'phone': '+1-555-3001'
            },
            {
                'broker_name': 'Global Trading Solutions',
                'broker_code': 'GTS001',
                'contact_person': 'Lisa Chen',
                'email': 'lisa@globaltradingsolutions.com',
                'phone': '+1-555-3002'
            },
        ]
        
        for data in brokers_data:
            Broker.objects.get_or_create(
                broker_code=data['broker_code'],
                defaults=data
            )
        
        self.stdout.write(f'Created {len(brokers_data)} brokers')

    def create_icoterms(self):
        icoterms_data = [
            {'icoterm_name': 'Free On Board', 'icoterm_code': 'FOB', 'description': 'Free On Board'},
            {'icoterm_name': 'Cost, Insurance and Freight', 'icoterm_code': 'CIF', 'description': 'Cost, Insurance and Freight'},
            {'icoterm_name': 'Delivered Duty Paid', 'icoterm_code': 'DDP', 'description': 'Delivered Duty Paid'},
            {'icoterm_name': 'Ex Works', 'icoterm_code': 'EXW', 'description': 'Ex Works'},
            {'icoterm_name': 'Free Carrier', 'icoterm_code': 'FCA', 'description': 'Free Carrier'},
        ]
        
        for data in icoterms_data:
            ICOTERM.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(icoterms_data)} ICOTERMs')

    def create_delivery_formats(self):
        delivery_formats_data = [
            {'delivery_format_name': 'Bulk Vessel', 'delivery_format_cost': 25.00, 'description': 'Bulk cargo vessel delivery'},
            {'delivery_format_name': 'Container Ship', 'delivery_format_cost': 35.00, 'description': 'Containerized delivery'},
            {'delivery_format_name': 'Tank Truck', 'delivery_format_cost': 15.00, 'description': 'Tank truck delivery'},
            {'delivery_format_name': 'Pipeline', 'delivery_format_cost': 5.00, 'description': 'Pipeline delivery'},
            {'delivery_format_name': 'Rail Car', 'delivery_format_cost': 20.00, 'description': 'Rail car delivery'},
        ]
        
        for data in delivery_formats_data:
            Delivery_Format.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(delivery_formats_data)} delivery formats')

    def create_additives(self):
        additives_data = [
            {'additive_name': 'Quality Premium', 'additive_cost': 10.00, 'description': 'Premium for high quality grade'},
            {'additive_name': 'Location Differential', 'additive_cost': 5.00, 'description': 'Location-based price adjustment'},
            {'additive_name': 'Protein Premium', 'additive_cost': 15.00, 'description': 'Premium for high protein content'},
            {'additive_name': 'Moisture Discount', 'additive_cost': -8.00, 'description': 'Discount for moisture content'},
        ]
        
        for data in additives_data:
            Additive.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(additives_data)} additives')

    def create_sociedades(self):
        sociedades_data = [
            {
                'sociedad_name': 'NextCRM Trading LLC',
                'tax_id': 'NCRM001',
                'address': '123 Trading Street, New York, NY 10001'
            },
            {
                'sociedad_name': 'NextCRM International Ltd',
                'tax_id': 'NCRM002',
                'address': '456 Commerce Avenue, London, UK EC1A 1BB'
            },
        ]
        
        for data in sociedades_data:
            Sociedad.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(sociedades_data)} sociedades')

    def create_trade_operation_types(self):
        trade_types_data = [
            {'trade_operation_type_name': 'Purchase', 'operation_code': 'BUY', 'description': 'Purchase/Buy operation'},
            {'trade_operation_type_name': 'Sale', 'operation_code': 'SELL', 'description': 'Sale/Sell operation'},
            {'trade_operation_type_name': 'Swap', 'operation_code': 'SWAP', 'description': 'Commodity swap operation'},
            {'trade_operation_type_name': 'Forward', 'operation_code': 'FWD', 'description': 'Forward contract'},
            {'trade_operation_type_name': 'Option', 'operation_code': 'OPT', 'description': 'Option contract'},
        ]
        
        for data in trade_types_data:
            Trade_Operation_Type.objects.get_or_create(**data)
        
        self.stdout.write(f'Created {len(trade_types_data)} trade operation types')