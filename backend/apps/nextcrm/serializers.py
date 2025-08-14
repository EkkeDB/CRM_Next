"""
Django REST Framework serializers for NextCRM models.
"""

import json
from rest_framework import serializers
from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Contact, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility, Trade_Setting
)


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'


class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cost_Center
        fields = '__all__'


class TraderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trader
        fields = '__all__'


class CommodityGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commodity_Group
        fields = '__all__'


class CommodityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commodity_Type
        fields = '__all__'


class CommoditySubtypeSerializer(serializers.ModelSerializer):
    commodity_type_name = serializers.CharField(source='commodity_type.commodity_type_name', read_only=True)
    
    class Meta:
        model = Commodity_Subtype
        fields = '__all__'


class CommoditySerializer(serializers.ModelSerializer):
    commodity_type_name = serializers.CharField(source='commodity_subtype.commodity_type.commodity_type_name', read_only=True)
    commodity_subtype_name = serializers.CharField(source='commodity_subtype.commodity_subtype_name', read_only=True)
    
    class Meta:
        model = Commodity
        fields = '__all__'


class CounterpartyFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty_Facility
        fields = '__all__'


class CounterpartySerializer(serializers.ModelSerializer):
    facilities = CounterpartyFacilitySerializer(many=True, read_only=True)
    contacts = serializers.SerializerMethodField()
    commodity_type_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Counterparty
        fields = '__all__'
    
    def get_contacts(self, obj):
        """Get contacts for this counterparty"""
        contacts = obj.contacts.filter(is_active=True)
        return [
            {
                'id': contact.id,
                'name': contact.name,
                'email': contact.email,
                'phone': contact.phone,
                'position': contact.position,
                'is_primary': contact.is_primary
            } for contact in contacts
        ]
    
    def get_commodity_type_names(self, obj):
        """Get commodity type names for display"""
        return [ct.commodity_type_name for ct in obj.commodity_types.all()]
        
    def validate_counterparty_name(self, value):
        """Validate counterparty name"""
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be empty")
        
        # Check for duplicate names during creation
        if not self.instance:
            if Counterparty.objects.filter(counterparty_name__iexact=value.strip()).exists():
                raise serializers.ValidationError("A counterparty with this name already exists")
        # Check for duplicate names during update (exclude current instance)
        elif self.instance and Counterparty.objects.filter(
            counterparty_name__iexact=value.strip()
        ).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A counterparty with this name already exists")
            
        return value.strip()
    
    def validate_counterparty_code(self, value):
        """Validate counterparty code"""
        if value:
            value = value.strip().upper()
            # Check for duplicate codes during creation
            if not self.instance:
                if Counterparty.objects.filter(counterparty_code__iexact=value).exists():
                    raise serializers.ValidationError("A counterparty with this code already exists")
            # Check for duplicate codes during update (exclude current instance)
            elif self.instance and Counterparty.objects.filter(
                counterparty_code__iexact=value
            ).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A counterparty with this code already exists")
        
        return value
    
    def validate_email(self, value):
        """Validate email format"""
        if value:
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, value):
                raise serializers.ValidationError("Please enter a valid email address")
        return value


class CounterpartyListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    commodity_type_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Counterparty
        fields = [
            'id', 'counterparty_name', 'counterparty_code', 'city', 
            'country', 'email', 'phone', 'is_active', 'commodity_type_names'
        ]
    
    def get_commodity_type_names(self, obj):
        """Get commodity type names for display"""
        return [ct.commodity_type_name for ct in obj.commodity_types.all()]


class ContactSerializer(serializers.ModelSerializer):
    counterparty_name = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    
    class Meta:
        model = Contact
        fields = '__all__'
    
    def validate_name(self, value):
        """Validate contact name"""
        if not value.strip():
            raise serializers.ValidationError("Contact name cannot be empty")
        return value.strip()
    
    def validate_email(self, value):
        """Validate email format"""
        if value:
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, value):
                raise serializers.ValidationError("Please enter a valid email address")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Ensure only one primary contact per counterparty
        if data.get('is_primary'):
            counterparty = data.get('counterparty')
            if counterparty:
                existing_primary = Contact.objects.filter(
                    counterparty=counterparty, 
                    is_primary=True
                )
                if self.instance:
                    existing_primary = existing_primary.exclude(id=self.instance.id)
                
                if existing_primary.exists():
                    raise serializers.ValidationError({
                        'is_primary': 'Only one primary contact is allowed per counterparty'
                    })
        
        return data


class ContactListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    counterparty_name = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'email', 'phone', 'position', 'department',
            'is_primary', 'is_active', 'counterparty', 'counterparty_name'
        ]


class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broker
        fields = '__all__'


class ICOTERMSerializer(serializers.ModelSerializer):
    class Meta:
        model = ICOTERM
        fields = '__all__'


class DeliveryFormatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery_Format
        fields = '__all__'


class AdditiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Additive
        fields = '__all__'


class SociedadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sociedad
        fields = '__all__'


class TradeOperationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade_Operation_Type
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    # Read-only fields for display
    trader_name = serializers.CharField(source='trader.trader_name', read_only=True)
    counterparty_name = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    commodity_name = serializers.CharField(source='commodity.commodity_name_short', read_only=True)
    commodity_type_name = serializers.CharField(source='commodity.commodity_subtype.commodity_type.commodity_type_name', read_only=True)
    commodity_subtype_name = serializers.CharField(source='commodity.commodity_subtype.commodity_subtype_name', read_only=True)
    broker_name = serializers.CharField(source='broker.broker_name', read_only=True)
    trade_currency_code = serializers.CharField(source='trade_currency.currency_code', read_only=True)
    broker_fee_currency_code = serializers.CharField(source='broker_fee_currency.currency_code', read_only=True)
    total_value = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('contract_number', 'created_at', 'updated_at')


class ContractListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    trader_name = serializers.CharField(source='trader.trader_name', read_only=True)
    counterparty_name = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    commodity_name = serializers.CharField(source='commodity.commodity_name_short', read_only=True)
    trade_currency_code = serializers.CharField(source='trade_currency.currency_code', read_only=True)
    total_value = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    
    class Meta:
        model = Contract
        fields = [
            'id', 'contract_number', 'status', 'date', 'trader_name',
            'counterparty_name', 'commodity_name', 'quantity', 'price',
            'trade_currency_code', 'total_value', 'delivery_period'
        ]


class ContractCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contracts with validation"""
    
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('contract_number', 'created_at', 'updated_at')
    
    def validate(self, data):
        """Custom validation for contract data"""
        errors = {}
        
        # Validate quantity
        if data.get('quantity', 0) <= 0:
            errors['quantity'] = 'Quantity must be greater than 0'
        
        # Validate price
        if data.get('price', 0) <= 0:
            errors['price'] = 'Price must be greater than 0'
        
        # Validate payment days
        if data.get('payment_days', 0) < 0:
            errors['payment_days'] = 'Payment days cannot be negative'
        
        # Validate delivery period is in the future
        from django.utils import timezone
        if data.get('delivery_period') and data['delivery_period'] < timezone.now().date():
            errors['delivery_period'] = 'Delivery period cannot be in the past'
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_contracts = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=20, decimal_places=2)
    active_contracts = serializers.IntegerField()
    pending_contracts = serializers.IntegerField()
    top_counterparties = serializers.ListField()
    top_commodities = serializers.ListField()
    monthly_contract_values = serializers.ListField()
    contract_status_distribution = serializers.ListField()


class TradeSettingSerializer(serializers.ModelSerializer):
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Trade_Setting
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_typed_value(self, obj):
        """Return the typed value for display purposes"""
        try:
            return obj.get_typed_value()
        except (ValueError, TypeError, json.JSONDecodeError):
            return obj.setting_value
    
    def validate_setting_value(self, value):
        """Validate setting value based on setting type"""
        setting_type = self.initial_data.get('setting_type', 'string')
        
        if setting_type == 'integer':
            try:
                int(value)
            except ValueError:
                raise serializers.ValidationError("Value must be a valid integer")
        elif setting_type == 'decimal':
            try:
                from decimal import Decimal
                Decimal(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Value must be a valid decimal")
        elif setting_type == 'boolean':
            if value.lower() not in ('true', 'false', '1', '0', 'yes', 'no', 'on', 'off'):
                raise serializers.ValidationError("Value must be a valid boolean (true/false, 1/0, yes/no, on/off)")
        elif setting_type == 'json':
            try:
                import json
                json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Value must be valid JSON")
        
        return value