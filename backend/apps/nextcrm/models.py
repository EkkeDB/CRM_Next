"""
Core business models for NextCRM commodity trading system.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Currency(models.Model):
    currency_code = models.CharField(max_length=3, unique=True)  # EUR, USD
    currency_name = models.CharField(max_length=50)
    currency_symbol = models.CharField(max_length=5, blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'currencies'
        verbose_name_plural = 'Currencies'

    def __str__(self):
        return f"{self.currency_code} - {self.currency_name}"


class Cost_Center(models.Model):
    cost_center_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cost_centers'
        verbose_name = 'Cost Center'
        verbose_name_plural = 'Cost Centers'

    def __str__(self):
        return self.cost_center_name


class Trader(models.Model):
    # Link to Django user (1:1 mapping)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trader', null=True, blank=True)
    
    trader_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Access control (defined as strings, will be updated after model definitions)
    # allowed_commodity_types - defined later
    # allowed_sociedades - defined later
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'traders'

    def __str__(self):
        return self.trader_name
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create a trader for a given user"""
        trader, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'trader_name': user.get_full_name() or user.username,
                'email': user.email,
            }
        )
        return trader, created


class Commodity_Group(models.Model):
    commodity_group_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commodity_groups'
        verbose_name = 'Commodity Group'
        verbose_name_plural = 'Commodity Groups'

    def __str__(self):
        return self.commodity_group_name


class Commodity_Type(models.Model):
    commodity_type_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commodity_types'
        verbose_name = 'Commodity Type'
        verbose_name_plural = 'Commodity Types'

    def __str__(self):
        return self.commodity_type_name


class Commodity_Subtype(models.Model):
    commodity_subtype_name = models.CharField(max_length=50)
    commodity_type = models.ForeignKey(Commodity_Type, on_delete=models.CASCADE, related_name='commodity_subtypes')
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commodity_subtypes'
        verbose_name = 'Commodity Subtype'
        verbose_name_plural = 'Commodity Subtypes'

    def __str__(self):
        return f"{self.commodity_subtype_name} ({self.commodity_type.commodity_type_name})"


class Commodity(models.Model):
    commodity_name_short = models.CharField(max_length=50)
    commodity_name_full = models.CharField(max_length=200, blank=True)
    commodity_subtype = models.ForeignKey(Commodity_Subtype, on_delete=models.CASCADE, related_name='commodities')
    unit_of_measure = models.CharField(max_length=20, default='MT')
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'commodities'
        verbose_name_plural = 'Commodities'

    @property
    def commodity_type(self):
        """Get the commodity type through the subtype"""
        return self.commodity_subtype.commodity_type

    def __str__(self):
        return f"{self.commodity_name_short} - {self.commodity_type.commodity_type_name}"


class Counterparty(models.Model):
    counterparty_name = models.CharField(max_length=100)
    counterparty_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    tax_id = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    
    # New fields - commodity types for filtering customers
    commodity_types = models.ManyToManyField(Commodity_Type, blank=True, related_name='counterparties')
    is_active = models.BooleanField(default=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'counterparties'
        verbose_name_plural = 'Counterparties'

    def clean(self):
        """Model validation"""
        from django.core.exceptions import ValidationError
        errors = {}
        
        # Validate that counterparty name is not empty
        if not self.counterparty_name or not self.counterparty_name.strip():
            errors['counterparty_name'] = 'Company name cannot be empty'
        
        # Validate email format if provided
        if self.email:
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, self.email):
                errors['email'] = 'Please enter a valid email address'
        
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Override save to perform validation and cleanup"""
        # Clean up fields
        if self.counterparty_name:
            self.counterparty_name = self.counterparty_name.strip()
        
        if self.counterparty_code:
            self.counterparty_code = self.counterparty_code.strip().upper()
        
        # Handle empty string as null for unique field
        if self.counterparty_code == '':
            self.counterparty_code = None
        
        # Call clean method for validation
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.counterparty_name


class Contact(models.Model):
    """Contact persons linked to counterparties"""
    counterparty = models.ForeignKey(Counterparty, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    position = models.CharField(max_length=100, blank=True)  # Job title/position
    department = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    is_primary = models.BooleanField(default=False)  # Primary contact for this counterparty
    is_active = models.BooleanField(default=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contacts'
        verbose_name_plural = 'Contacts'
        constraints = [
            models.UniqueConstraint(
                fields=['counterparty', 'is_primary'],
                condition=models.Q(is_primary=True),
                name='unique_primary_contact_per_counterparty'
            ),
        ]

    def clean(self):
        """Model validation"""
        from django.core.exceptions import ValidationError
        errors = {}
        
        # Validate that contact name is not empty
        if not self.name or not self.name.strip():
            errors['name'] = 'Contact name cannot be empty'
        
        # Validate email format if provided
        if self.email:
            import re
            email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
            if not re.match(email_pattern, self.email):
                errors['email'] = 'Please enter a valid email address'
        
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Override save to perform validation and cleanup"""
        # Clean up fields
        if self.name:
            self.name = self.name.strip()
        
        # Call clean method for validation
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.counterparty.counterparty_name})"


class Broker(models.Model):
    broker_name = models.CharField(max_length=100)
    broker_code = models.CharField(max_length=20, unique=True, blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'brokers'

    def __str__(self):
        return self.broker_name


class ICOTERM(models.Model):
    icoterm_name = models.CharField(max_length=50)
    icoterm_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'icoterms'
        verbose_name = 'ICOTERM'
        verbose_name_plural = 'ICOTERMS'

    def __str__(self):
        return f"{self.icoterm_code} - {self.icoterm_name}"


class Delivery_Format(models.Model):
    delivery_format_name = models.CharField(max_length=50)
    delivery_format_cost = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'delivery_formats'
        verbose_name = 'Delivery Format'
        verbose_name_plural = 'Delivery Formats'

    def __str__(self):
        return self.delivery_format_name


class Additive(models.Model):
    additive_name = models.CharField(max_length=50)
    additive_cost = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'additives'

    def __str__(self):
        return self.additive_name


class Sociedad(models.Model):
    sociedad_name = models.CharField(max_length=50)
    tax_id = models.CharField(max_length=20, unique=True, blank=True)
    address = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sociedades'
        verbose_name_plural = 'Sociedades'

    def __str__(self):
        return self.sociedad_name


class Trade_Operation_Type(models.Model):
    trade_operation_type_name = models.CharField(max_length=50)
    operation_code = models.CharField(max_length=10, unique=True, blank=True)
    description = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'trade_operation_types'
        verbose_name = 'Trade Operation Type'
        verbose_name_plural = 'Trade Operation Types'

    def __str__(self):
        return self.trade_operation_type_name


class Contract(models.Model):
    """Core contract model with comprehensive relationships"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('executed', 'Executed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Auto-generated fields
    contract_number = models.CharField(max_length=50, unique=True, blank=True)
    
    # Core relationships (as per original design)
    trader = models.ForeignKey(Trader, on_delete=models.PROTECT)
    trade_operation_type = models.ForeignKey(Trade_Operation_Type, on_delete=models.PROTECT)
    sociedad = models.ForeignKey(Sociedad, on_delete=models.PROTECT)
    counterparty = models.ForeignKey(Counterparty, on_delete=models.PROTECT)
    commodity = models.ForeignKey(Commodity, on_delete=models.PROTECT)
    delivery_format = models.ForeignKey(Delivery_Format, on_delete=models.PROTECT)
    additive = models.ForeignKey(Additive, on_delete=models.PROTECT)
    broker = models.ForeignKey(Broker, on_delete=models.PROTECT)
    icoterm = models.ForeignKey(ICOTERM, on_delete=models.PROTECT)
    cost_center = models.ForeignKey(Cost_Center, on_delete=models.PROTECT)
    
    # Financial information
    broker_fee = models.DecimalField(max_digits=10, decimal_places=2)
    broker_fee_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='broker_fee_contracts')
    freight_cost = models.DecimalField(max_digits=10, decimal_places=2)
    forex = models.DecimalField(max_digits=10, decimal_places=4)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    trade_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='trade_contracts')
    
    # Contract terms
    payment_days = models.IntegerField()
    quantity = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    unit_of_measure = models.CharField(max_length=20, default='MT')
    
    # Delivery information
    entrega = models.CharField(max_length=200)  # Delivery point
    delivery_period = models.DateField()
    
    # Contract dates
    date = models.DateField()  # Contract date
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'contracts'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'date']),
            models.Index(fields=['trader', 'date']),
            models.Index(fields=['counterparty', 'date']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate contract number
        if not self.contract_number:
            year = timezone.now().year
            last_contract = Contract.objects.filter(
                contract_number__startswith=f"CONT-{year}"
            ).order_by('-id').first()
            
            if last_contract and last_contract.contract_number:
                try:
                    last_number = int(last_contract.contract_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            self.contract_number = f"CONT-{year}-{new_number:06d}"
        
        super().save(*args, **kwargs)
    
    @property
    def commodity_type(self):
        """Get the commodity type through the commodity hierarchy"""
        return self.commodity.commodity_type
    
    @property
    def commodity_subtype(self):
        """Get the commodity subtype through the commodity hierarchy"""
        return self.commodity.commodity_subtype

    @property
    def total_value(self):
        """Calculate total contract value"""
        from decimal import Decimal
        try:
            price = Decimal(str(self.price)) if self.price else Decimal('0')
            quantity = Decimal(str(self.quantity)) if self.quantity else Decimal('0')
            return price * quantity
        except (ValueError, TypeError):
            return Decimal('0')
    
    def __str__(self):
        return f"{self.contract_number} - {self.counterparty.counterparty_name}"


class Counterparty_Facility(models.Model):
    """Counterparty facilities/locations"""
    counterparty = models.ForeignKey(Counterparty, on_delete=models.CASCADE, related_name='facilities')
    counterparty_facility_name = models.CharField(max_length=100)
    facility_type = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'counterparty_facilities'
        verbose_name = 'Counterparty Facility'
        verbose_name_plural = 'Counterparty Facilities'

    def __str__(self):
        return f"{self.counterparty.counterparty_name} - {self.counterparty_facility_name}"


class Trade_Setting(models.Model):
    setting_name = models.CharField(max_length=100, unique=True)
    setting_value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=[
        ('string', 'String'),
        ('integer', 'Integer'),
        ('decimal', 'Decimal'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
    ], default='string')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'trade_settings'
        verbose_name = 'Trade Setting'
        verbose_name_plural = 'Trade Settings'
        ordering = ['setting_name']

    def __str__(self):
        return f"{self.setting_name}: {self.setting_value}"
    
    def get_typed_value(self):
        """Return the setting value converted to its proper type"""
        if self.setting_type == 'integer':
            return int(self.setting_value)
        elif self.setting_type == 'decimal':
            from decimal import Decimal
            return Decimal(self.setting_value)
        elif self.setting_type == 'boolean':
            return self.setting_value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'json':
            import json
            return json.loads(self.setting_value)
        else:
            return self.setting_value


# Add many-to-many relationships to Trader after all models are defined
Trader.add_to_class('allowed_commodity_types', models.ManyToManyField(
    'Commodity_Type', 
    blank=True, 
    related_name='traders',
    help_text="Commodity types this trader can access"
))

Trader.add_to_class('allowed_sociedades', models.ManyToManyField(
    'Sociedad', 
    blank=True, 
    related_name='traders',
    help_text="Sociedades this trader can access"
))