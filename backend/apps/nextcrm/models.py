"""
Core business models for NextCRM commodity trading system.
"""

from django.db import models
from django.utils import timezone


class Currency(models.Model):
    currency_code = models.CharField(max_length=3, unique=True)  # EUR, USD
    currency_name = models.CharField(max_length=50)
    currency_symbol = models.CharField(max_length=5, blank=True)
    
    class Meta:
        db_table = 'currencies'
        verbose_name_plural = 'Currencies'

    def __str__(self):
        return f"{self.currency_code} - {self.currency_name}"


class Cost_Center(models.Model):
    cost_center_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'cost_centers'
        verbose_name = 'Cost Center'
        verbose_name_plural = 'Cost Centers'

    def __str__(self):
        return self.cost_center_name


class Trader(models.Model):
    trader_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        db_table = 'traders'

    def __str__(self):
        return self.trader_name


class Commodity_Group(models.Model):
    commodity_group_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'commodity_groups'
        verbose_name = 'Commodity Group'
        verbose_name_plural = 'Commodity Groups'

    def __str__(self):
        return self.commodity_group_name


class Commodity_Type(models.Model):
    commodity_type_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'commodity_types'
        verbose_name = 'Commodity Type'
        verbose_name_plural = 'Commodity Types'

    def __str__(self):
        return self.commodity_type_name


class Commodity_Subtype(models.Model):
    commodity_subtype_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'commodity_subtypes'
        verbose_name = 'Commodity Subtype'
        verbose_name_plural = 'Commodity Subtypes'

    def __str__(self):
        return self.commodity_subtype_name


class Commodity(models.Model):
    commodity_name_short = models.CharField(max_length=50)
    commodity_name_full = models.CharField(max_length=200, blank=True)
    commodity_group = models.ForeignKey(Commodity_Group, on_delete=models.CASCADE)
    commodity_type = models.ForeignKey(Commodity_Type, on_delete=models.CASCADE)
    commodity_subtype = models.ForeignKey(Commodity_Subtype, on_delete=models.CASCADE)
    unit_of_measure = models.CharField(max_length=20, default='MT')
    
    class Meta:
        db_table = 'commodities'
        verbose_name_plural = 'Commodities'

    def __str__(self):
        return f"{self.commodity_name_short} - {self.commodity_group.commodity_group_name}"


class Counterparty(models.Model):
    counterparty_name = models.CharField(max_length=100)
    counterparty_code = models.CharField(max_length=20, unique=True, blank=True)
    tax_id = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    is_supplier = models.BooleanField(default=False)
    is_customer = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'counterparties'
        verbose_name_plural = 'Counterparties'

    def __str__(self):
        return self.counterparty_name


class Broker(models.Model):
    broker_name = models.CharField(max_length=100)
    broker_code = models.CharField(max_length=20, unique=True, blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        db_table = 'brokers'

    def __str__(self):
        return self.broker_name


class ICOTERM(models.Model):
    icoterm_name = models.CharField(max_length=50)
    icoterm_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    
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
    
    class Meta:
        db_table = 'additives'

    def __str__(self):
        return self.additive_name


class Sociedad(models.Model):
    sociedad_name = models.CharField(max_length=50)
    tax_id = models.CharField(max_length=20, unique=True, blank=True)
    address = models.TextField(blank=True)
    
    class Meta:
        db_table = 'sociedades'
        verbose_name_plural = 'Sociedades'

    def __str__(self):
        return self.sociedad_name


class Trade_Operation_Type(models.Model):
    trade_operation_type_name = models.CharField(max_length=50)
    operation_code = models.CharField(max_length=10, unique=True, blank=True)
    description = models.TextField(blank=True)
    
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
    commodity_group = models.ForeignKey(Commodity_Group, on_delete=models.PROTECT)
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
    def total_value(self):
        """Calculate total contract value"""
        return self.price * self.quantity
    
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