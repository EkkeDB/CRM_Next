"""
Django REST Framework serializers for NextCRM models.
"""

import json
from decimal import Decimal
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility, Trade_Setting, Contact,
    Deal, DealLine, FacilityConsumption, Counterparty_Note
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
    class Meta:
        model = Commodity_Subtype
        fields = '__all__'


class CommoditySerializer(serializers.ModelSerializer):
    commodity_group_name = serializers.CharField(source='commodity_group.commodity_group_name', read_only=True)
    commodity_type_name = serializers.CharField(source='commodity_type.commodity_type_name', read_only=True)
    commodity_subtype_name = serializers.CharField(source='commodity_subtype.commodity_subtype_name', read_only=True)
    
    class Meta:
        model = Commodity
        fields = '__all__'


class CounterpartyFacilitySerializer(serializers.ModelSerializer):
    # Allow blank/optional for segment and nullable lat/lng
    segment = serializers.ChoiceField(
        choices=Counterparty_Facility.SEGMENT_CHOICES,
        required=False,
        allow_blank=True,
    )
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    class Meta:
        model = Counterparty_Facility
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'counterparty_facility_name': {'required': True},
            'counterparty': {'required': True},
        }

    def validate_segment(self, value):
        # Coerce None to '' (DB stores empty string when unset)
        if value is None:
            return ''
        return value

    def validate_counterparty_facility_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Facility name is required')
        return value.strip()

    def validate(self, attrs):
        # Normalize whitespace for address fields
        for key in ['address', 'city', 'country', 'facility_type']:
            if key in attrs and isinstance(attrs[key], str):
                attrs[key] = attrs[key].strip()
        return attrs

    def validate_latitude(self, value):
        if value is None:
            return value
        # Range check
        if value < Decimal('-90') or value > Decimal('90'):
            raise serializers.ValidationError('Latitude must be between -90 and 90')
        # Quantize to 6 decimal places
        return value.quantize(Decimal('0.000001'))

    def validate_longitude(self, value):
        if value is None:
            return value
        if value < Decimal('-180') or value > Decimal('180'):
            raise serializers.ValidationError('Longitude must be between -180 and 180')
        return value.quantize(Decimal('0.000001'))


class FacilityConsumptionSerializer(serializers.ModelSerializer):
    commodity_name = serializers.CharField(source='commodity.commodity_name_short', read_only=True)

    class Meta:
        model = FacilityConsumption
        fields = ['id', 'facility', 'commodity', 'commodity_name', 'monthly_volume', 'yearly_volume']
        read_only_fields = ['id', 'yearly_volume']
        validators = [
            UniqueTogetherValidator(
                queryset=FacilityConsumption.objects.all(),
                fields=['facility', 'commodity'],
                message='This commodity already has a consumption record for this facility.'
            )
        ]

    def validate_monthly_volume(self, value):
        # Ensure monthly volume is a whole number within reasonable bounds
        from decimal import Decimal
        if value is None:
            raise serializers.ValidationError('Monthly volume is required')
        if value < 1 or value > 5000:
            raise serializers.ValidationError('Monthly volume must be between 1 and 5000')
        # Check if value has no fractional part
        if (value % Decimal('1')) != 0:
            raise serializers.ValidationError('Monthly volume must be a whole number (no decimals)')
        return value


class CounterpartyFacilityDetailSerializer(CounterpartyFacilitySerializer):
    consumptions = FacilityConsumptionSerializer(many=True, read_only=True)


class CounterpartySerializer(serializers.ModelSerializer):
    facilities = CounterpartyFacilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Counterparty
        fields = '__all__'
        
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
    
    def validate(self, data):
        """Cross-field validation"""
        # Ensure at least one type is selected
        if not data.get('is_customer') and not data.get('is_supplier'):
            raise serializers.ValidationError({
                'is_customer': 'Counterparty must be either a customer, supplier, or both'
            })
        
        return data


class CounterpartyListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    class Meta:
        model = Counterparty
        fields = [
            'id', 'counterparty_name', 'counterparty_code', 'city', 
            'country', 'is_supplier', 'is_customer', 'email', 'phone'
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
    deal_number = serializers.CharField(source='deal.deal_number', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'contract_number', 'status', 'date', 'trader_name',
            'counterparty_name', 'commodity_name', 'quantity', 'price',
            'trade_currency_code', 'total_value', 'delivery_period',
            'delivery_period_start', 'delivery_period_end', 'deal', 'deal_number'
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
        
        # Validate delivery period: accept start/end; fallback to legacy delivery_period
        from django.utils import timezone
        dps = data.get('delivery_period_start')
        dpe = data.get('delivery_period_end')
        dp = data.get('delivery_period')
        if dps or dpe:
            if not (dps and dpe):
                errors['delivery_period_start'] = 'Both delivery_period_start and delivery_period_end are required'
            elif dps > dpe:
                errors['delivery_period_start'] = 'Start cannot be after end'
            elif dps < timezone.now().date():
                errors['delivery_period_start'] = 'Delivery period cannot be in the past'
        elif dp:
            if dp < timezone.now().date():
                errors['delivery_period'] = 'Delivery period cannot be in the past'
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data


class DealLineSerializer(serializers.ModelSerializer):
    contract_id = serializers.IntegerField(source='materialized_contract.id', read_only=True)
    contract_number = serializers.CharField(source='materialized_contract.contract_number', read_only=True)

    class Meta:
        model = DealLine
        fields = [
            'id', 'deal', 'delivery_period_start', 'delivery_period_end',
            'quantity', 'sync_status', 'contract_id', 'contract_number'
        ]
        read_only_fields = ('sync_status', 'contract_id', 'contract_number')


class DealSerializer(serializers.ModelSerializer):
    lines = DealLineSerializer(many=True, read_only=True)
    trader_name = serializers.CharField(source='trader.trader_name', read_only=True)
    counterparty_name = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    commodity_name = serializers.CharField(source='commodity.commodity_name_short', read_only=True)
    trade_currency_code = serializers.CharField(source='trade_currency.currency_code', read_only=True)
    broker_fee_currency_code = serializers.CharField(source='broker_fee_currency.currency_code', read_only=True)

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ('deal_number', 'created_at', 'updated_at')


class DealCreateLineInput(serializers.Serializer):
    delivery_period_start = serializers.DateField()
    delivery_period_end = serializers.DateField()
    quantity = serializers.DecimalField(max_digits=15, decimal_places=3)


class DealCreateSerializer(serializers.ModelSerializer):
    lines = DealCreateLineInput(many=True, write_only=True)

    class Meta:
        model = Deal
        fields = [
            'id', 'deal_number', 'trader', 'trade_operation_type', 'sociedad', 'counterparty',
            'commodity', 'delivery_format', 'additive', 'broker', 'icoterm', 'cost_center',
            'broker_fee', 'broker_fee_currency', 'freight_cost', 'forex', 'price', 'trade_currency',
            'payment_days', 'unit_of_measure', 'entrega', 'date', 'status', 'notes', 'lines'
        ]
        read_only_fields = ('deal_number',)

    def validate_lines(self, value):
        if not value:
            raise serializers.ValidationError('At least one delivery period (line) is required')
        # Basic checks: start <= end, quantity > 0, no overlaps
        errors = []
        periods = []
        for idx, line in enumerate(value):
            start = line.get('delivery_period_start')
            end = line.get('delivery_period_end')
            qty = line.get('quantity')
            if start and end and start > end:
                errors.append(f'Line {idx+1}: start cannot be after end')
            if qty is None or qty <= 0:
                errors.append(f'Line {idx+1}: quantity must be greater than 0')
            periods.append((start, end))
        # Overlap detection (same deal)
        sorted_periods = sorted(periods, key=lambda p: p[0])
        for i in range(1, len(sorted_periods)):
            prev_end = sorted_periods[i-1][1]
            cur_start = sorted_periods[i][0]
            if prev_end >= cur_start:
                errors.append('Delivery periods must not overlap')
                break
        if errors:
            raise serializers.ValidationError({'lines': errors})
        return value

    def create(self, validated_data):
        lines = validated_data.pop('lines', [])
        deal = Deal.objects.create(**validated_data)
        DealLine.objects.bulk_create([
            DealLine(
                deal=deal,
                delivery_period_start=l['delivery_period_start'],
                delivery_period_end=l['delivery_period_end'],
                quantity=l['quantity'],
            ) for l in lines
        ])
        return deal


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


class ContactSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source='counterparty.counterparty_name', read_only=True)
    counterparty = serializers.PrimaryKeyRelatedField(queryset=Counterparty.objects.all(), write_only=True)
    counterparty_id = serializers.IntegerField(source='counterparty.id', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'email', 'phone', 'position', 'city', 'country',
            'status', 'source', 'notes', 'created_at', 'last_contact',
            'counterparty', 'company', 'counterparty_id'
        ]
        read_only_fields = ['id', 'created_at', 'company']


class CounterpartyNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty_Note
        fields = ['id', 'counterparty', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Note content cannot be empty')
        return value.strip()
