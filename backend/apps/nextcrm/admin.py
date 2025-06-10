"""
Django admin configuration for NextCRM models.
"""

from django.contrib import admin
from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility
)


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('currency_code', 'currency_name', 'currency_symbol')
    search_fields = ('currency_code', 'currency_name')
    ordering = ('currency_code',)


@admin.register(Cost_Center)
class CostCenterAdmin(admin.ModelAdmin):
    list_display = ('cost_center_name', 'description')
    search_fields = ('cost_center_name',)


@admin.register(Trader)
class TraderAdmin(admin.ModelAdmin):
    list_display = ('trader_name', 'email', 'phone')
    search_fields = ('trader_name', 'email')
    ordering = ('trader_name',)


@admin.register(Commodity_Group)
class CommodityGroupAdmin(admin.ModelAdmin):
    list_display = ('commodity_group_name', 'description')
    search_fields = ('commodity_group_name',)


@admin.register(Commodity_Type)
class CommodityTypeAdmin(admin.ModelAdmin):
    list_display = ('commodity_type_name', 'description')
    search_fields = ('commodity_type_name',)


@admin.register(Commodity_Subtype)
class CommoditySubtypeAdmin(admin.ModelAdmin):
    list_display = ('commodity_subtype_name', 'description')
    search_fields = ('commodity_subtype_name',)


@admin.register(Commodity)
class CommodityAdmin(admin.ModelAdmin):
    list_display = ('commodity_name_short', 'commodity_name_full', 'commodity_subtype', 'unit_of_measure')
    list_filter = ('commodity_subtype', 'commodity_subtype__commodity_type', 'commodity_subtype__commodity_type__commodity_group')
    search_fields = ('commodity_name_short', 'commodity_name_full')
    ordering = ('commodity_name_short',)


class CounterpartyFacilityInline(admin.TabularInline):
    model = Counterparty_Facility
    extra = 1


@admin.register(Counterparty)
class CounterpartyAdmin(admin.ModelAdmin):
    list_display = ('counterparty_name', 'counterparty_code', 'city', 'country', 'is_supplier', 'is_customer')
    list_filter = ('is_supplier', 'is_customer', 'country')
    search_fields = ('counterparty_name', 'counterparty_code', 'email')
    ordering = ('counterparty_name',)
    inlines = [CounterpartyFacilityInline]


@admin.register(Broker)
class BrokerAdmin(admin.ModelAdmin):
    list_display = ('broker_name', 'broker_code', 'contact_person', 'email')
    search_fields = ('broker_name', 'broker_code', 'contact_person')
    ordering = ('broker_name',)


@admin.register(ICOTERM)
class ICOTERMAdmin(admin.ModelAdmin):
    list_display = ('icoterm_code', 'icoterm_name', 'description')
    search_fields = ('icoterm_code', 'icoterm_name')
    ordering = ('icoterm_code',)


@admin.register(Delivery_Format)
class DeliveryFormatAdmin(admin.ModelAdmin):
    list_display = ('delivery_format_name', 'delivery_format_cost')
    search_fields = ('delivery_format_name',)
    ordering = ('delivery_format_name',)


@admin.register(Additive)
class AdditiveAdmin(admin.ModelAdmin):
    list_display = ('additive_name', 'additive_cost')
    search_fields = ('additive_name',)
    ordering = ('additive_name',)


@admin.register(Sociedad)
class SociedadAdmin(admin.ModelAdmin):
    list_display = ('sociedad_name', 'tax_id')
    search_fields = ('sociedad_name', 'tax_id')
    ordering = ('sociedad_name',)


@admin.register(Trade_Operation_Type)
class TradeOperationTypeAdmin(admin.ModelAdmin):
    list_display = ('trade_operation_type_name', 'operation_code')
    search_fields = ('trade_operation_type_name', 'operation_code')
    ordering = ('trade_operation_type_name',)


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = (
        'contract_number', 'counterparty', 'commodity', 'quantity', 
        'price', 'status', 'date', 'trader'
    )
    list_filter = (
        'status', 'date', 'trader', 'counterparty', 'commodity__commodity_subtype__commodity_type__commodity_group',
        'trade_operation_type'
    )
    search_fields = (
        'contract_number', 'counterparty__counterparty_name',
        'commodity__commodity_name_short', 'trader__trader_name'
    )
    readonly_fields = ('contract_number', 'created_at', 'updated_at', 'total_value')
    ordering = ('-date', '-created_at')
    
    fieldsets = (
        ('Contract Information', {
            'fields': ('contract_number', 'status', 'date', 'notes')
        }),
        ('Parties', {
            'fields': ('trader', 'counterparty', 'broker', 'sociedad')
        }),
        ('Commodity Details', {
            'fields': (
                'commodity', 'quantity', 'unit_of_measure',
                'delivery_format', 'additive'
            )
        }),
        ('Financial Terms', {
            'fields': (
                'price', 'trade_currency', 'broker_fee', 'broker_fee_currency',
                'freight_cost', 'forex', 'payment_days'
            )
        }),
        ('Delivery & Operations', {
            'fields': (
                'trade_operation_type', 'icoterm', 'entrega', 'delivery_period',
                'cost_center'
            )
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'is_active', 'total_value'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Counterparty_Facility)
class CounterpartyFacilityAdmin(admin.ModelAdmin):
    list_display = ('counterparty', 'counterparty_facility_name', 'facility_type', 'city', 'country')
    list_filter = ('facility_type', 'country', 'is_active')
    search_fields = ('counterparty_facility_name', 'counterparty__counterparty_name')
    ordering = ('counterparty__counterparty_name', 'counterparty_facility_name')