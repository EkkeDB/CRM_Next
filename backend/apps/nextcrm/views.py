"""
Django REST Framework views for NextCRM API.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncMonth

from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility, Trade_Setting, Contact,
    Deal, DealLine
)
from .serializers import (
    CurrencySerializer, CostCenterSerializer, TraderSerializer,
    CommodityGroupSerializer, CommodityTypeSerializer, CommoditySubtypeSerializer,
    CommoditySerializer, CounterpartySerializer, CounterpartyListSerializer,
    BrokerSerializer, ICOTERMSerializer, DeliveryFormatSerializer,
    AdditiveSerializer, SociedadSerializer, TradeOperationTypeSerializer,
    ContractSerializer, ContractListSerializer, ContractCreateSerializer,
    CounterpartyFacilitySerializer, DashboardStatsSerializer, TradeSettingSerializer, ContactSerializer,
    DealSerializer, DealCreateSerializer, DealLineSerializer
)


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['currency_code', 'currency_name']
    ordering_fields = ['currency_code', 'currency_name']
    ordering = ['currency_code']


class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = Cost_Center.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cost_center_name']
    ordering = ['cost_center_name']


class TraderViewSet(viewsets.ModelViewSet):
    queryset = Trader.objects.all()
    serializer_class = TraderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['trader_name', 'email']
    ordering = ['trader_name']


class CommodityGroupViewSet(viewsets.ModelViewSet):
    queryset = Commodity_Group.objects.all()
    serializer_class = CommodityGroupSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['commodity_group_name']
    ordering = ['commodity_group_name']


class CommodityTypeViewSet(viewsets.ModelViewSet):
    queryset = Commodity_Type.objects.all()
    serializer_class = CommodityTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['commodity_type_name', 'description']
    ordering = ['commodity_type_name']


class CommoditySubtypeViewSet(viewsets.ModelViewSet):
    queryset = Commodity_Subtype.objects.all()
    serializer_class = CommoditySubtypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['commodity_subtype_name', 'description']
    ordering = ['commodity_subtype_name']


class CommodityViewSet(viewsets.ModelViewSet):
    queryset = Commodity.objects.select_related(
        'commodity_group', 'commodity_type', 'commodity_subtype'
    ).all()
    serializer_class = CommoditySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['commodity_group', 'commodity_type', 'commodity_subtype']
    search_fields = ['commodity_name_short', 'commodity_name_full']
    ordering = ['commodity_name_short']


class CounterpartyViewSet(viewsets.ModelViewSet):
    queryset = Counterparty.objects.prefetch_related('facilities').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_supplier', 'is_customer', 'country']
    search_fields = ['counterparty_name', 'counterparty_code', 'email']
    ordering = ['counterparty_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return CounterpartyListSerializer
        return CounterpartySerializer


class CounterpartyFacilityViewSet(viewsets.ModelViewSet):
    queryset = Counterparty_Facility.objects.select_related('counterparty').all()
    serializer_class = CounterpartyFacilitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['counterparty', 'facility_type', 'country', 'is_active']
    search_fields = ['counterparty_facility_name', 'counterparty__counterparty_name']
    ordering = ['counterparty__counterparty_name', 'counterparty_facility_name']


class BrokerViewSet(viewsets.ModelViewSet):
    queryset = Broker.objects.all()
    serializer_class = BrokerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['broker_name', 'broker_code', 'contact_person']
    ordering = ['broker_name']


class ICOTERMViewSet(viewsets.ModelViewSet):
    queryset = ICOTERM.objects.all()
    serializer_class = ICOTERMSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['icoterm_code', 'icoterm_name']
    ordering = ['icoterm_code']


class DeliveryFormatViewSet(viewsets.ModelViewSet):
    queryset = Delivery_Format.objects.all()
    serializer_class = DeliveryFormatSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['delivery_format_name']
    ordering = ['delivery_format_name']


class AdditiveViewSet(viewsets.ModelViewSet):
    queryset = Additive.objects.all()
    serializer_class = AdditiveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['additive_name']
    ordering = ['additive_name']


class SociedadViewSet(viewsets.ModelViewSet):
    queryset = Sociedad.objects.all()
    serializer_class = SociedadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sociedad_name', 'tax_id']
    ordering = ['sociedad_name']


class TradeOperationTypeViewSet(viewsets.ModelViewSet):
    queryset = Trade_Operation_Type.objects.all()
    serializer_class = TradeOperationTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['trade_operation_type_name', 'operation_code']
    ordering = ['trade_operation_type_name']
    filterset_fields = ['trade_operation_type_name', 'operation_code', 'price_type', 'side']


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related(
        'trader', 'counterparty', 'commodity__commodity_subtype',
        'broker', 'trade_currency', 'broker_fee_currency'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'status', 'trader', 'counterparty', 'commodity',
        'trade_operation_type', 'date', 'commodity__commodity_subtype'
    ]
    search_fields = [
        'contract_number', 'counterparty__counterparty_name',
        'commodity__commodity_name_short', 'trader__trader_name'
    ]
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractListSerializer
        elif self.action == 'create':
            return ContractCreateSerializer
        return ContractSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        safe_fields = [
            'delivery_format', 'additive', 'broker', 'icoterm', 'cost_center',
            'broker_fee', 'broker_fee_currency', 'freight_cost', 'forex', 'price',
            'trade_currency', 'payment_days', 'unit_of_measure', 'entrega', 'notes'
        ]
        changed = []
        for f in safe_fields:
            if f in serializer.validated_data:
                new_val = serializer.validated_data.get(f)
                if getattr(instance, f) != new_val:
                    changed.append(f)

        self.perform_update(serializer)

        if changed:
            overrides = instance.override_fields or []
            # Keep unique entries
            for f in changed:
                if f not in overrides:
                    overrides.append(f)
            instance.override_fields = overrides
            instance.save(update_fields=['override_fields'])

        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        # Basic stats
        total_contracts = Contract.objects.count()
        total_value = (
            Contract.objects.aggregate(
                total=Sum(
                    F('price') * F('quantity'),
                    output_field=DecimalField(max_digits=20, decimal_places=2)
                )
            )['total']
            or 0
        )
        
        active_contracts = Contract.objects.filter(
            status__in=['approved', 'executed']
        ).count()
        
        pending_contracts = Contract.objects.filter(status='draft').count()
        
        # Top counterparties by contract value
        top_counterparties = list(
            Contract.objects.values('counterparty__counterparty_name')
            .annotate(
                total_value=Sum(
                    F('price') * F('quantity'),
                    output_field=DecimalField(max_digits=20, decimal_places=2)
                ),
                contract_count=Count('id')
            )
            .order_by('-total_value')[:5]
        )
        
        # Top commodities by volume
        top_commodities = list(
            Contract.objects.values('commodity__commodity_name_short')
            .annotate(total_quantity=Sum('quantity'), contract_count=Count('id'))
            .order_by('-total_quantity')[:5]
        )
        
        # Monthly contract values for the last 12 months
        twelve_months_ago = timezone.now().date() - timedelta(days=365)
        monthly_values = list(
            Contract.objects.filter(date__gte=twelve_months_ago)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(
                total_value=Sum(
                    F('price') * F('quantity'),
                    output_field=DecimalField(max_digits=20, decimal_places=2)
                ),
                contract_count=Count('id')
            )
            .order_by('month')
        )
        
        # Contract status distribution
        status_distribution = list(
            Contract.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        stats = {
            'total_contracts': total_contracts,
            'total_value': total_value,
            'active_contracts': active_contracts,
            'pending_contracts': pending_contracts,
            'top_counterparties': top_counterparties,
            'top_commodities': top_commodities,
            'monthly_contract_values': monthly_values,
            'contract_status_distribution': status_distribution,
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.select_related(
        'trader', 'counterparty', 'commodity', 'trade_currency', 'broker_fee_currency'
    ).prefetch_related('lines').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['deal_number', 'counterparty__counterparty_name']
    ordering = ['-date', '-created_at']
    filterset_fields = ['status', 'counterparty', 'trader', 'trade_operation_type']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DealCreateSerializer
        return DealSerializer

    def _propagate_to_children(self, deal: Deal):
        """Propagate header fields to non-executed child contracts."""
        fields_to_copy = [
            'delivery_format', 'additive', 'broker', 'icoterm', 'cost_center',
            'broker_fee', 'broker_fee_currency', 'freight_cost', 'forex', 'price',
            'trade_currency', 'payment_days', 'unit_of_measure', 'entrega', 'notes'
        ]
        updatable_statuses = ['draft', 'approved']

        contracts = list(deal.contracts.select_for_update().filter(status__in=updatable_statuses))
        updates = []
        for c in contracts:
            overrides = set(c.override_fields or [])
            any_change = False
            for f in fields_to_copy:
                if f in overrides:
                    continue
                new_val = getattr(deal, f)
                if getattr(c, f) != new_val:
                    setattr(c, f, new_val)
                    any_change = True
            if any_change:
                updates.append(c)
        if updates:
            Contract.objects.bulk_update(updates, fields=fields_to_copy)
            DealLine.objects.filter(deal=deal, materialized_contract__in=[c.id for c in updates]).update(sync_status='synced')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            self.perform_update(serializer)
            # Automatically propagate by default; allow opt-out via ?propagate=false
            propagate = request.query_params.get('propagate', 'true').lower() != 'false'
            if propagate:
                # Refresh instance to ensure latest values
                instance.refresh_from_db()
                self._propagate_to_children(instance)
        # Return fresh representation
        return Response(DealSerializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def generate_contracts(self, request, pk=None):
        """Materialize one Contract per DealLine that lacks a contract"""
        deal = self.get_object()
        generated = 0
        with transaction.atomic():
            for line in deal.lines.select_for_update():
                if line.materialized_contract is not None:
                    continue
                contract = Contract(
                    trader=deal.trader,
                    trade_operation_type=deal.trade_operation_type,
                    sociedad=deal.sociedad,
                    counterparty=deal.counterparty,
                    commodity=deal.commodity,
                    delivery_format=deal.delivery_format,
                    additive=deal.additive,
                    broker=deal.broker,
                    icoterm=deal.icoterm,
                    cost_center=deal.cost_center,
                    broker_fee=deal.broker_fee,
                    broker_fee_currency=deal.broker_fee_currency,
                    freight_cost=deal.freight_cost,
                    forex=deal.forex,
                    price=deal.price,
                    trade_currency=deal.trade_currency,
                    payment_days=deal.payment_days,
                    quantity=line.quantity,
                    unit_of_measure=deal.unit_of_measure,
                    entrega=deal.entrega,
                    delivery_period=line.delivery_period_start,
                    date=deal.date,
                    status=deal.status,
                    notes=deal.notes,
                    deal=deal,
                )
                contract.save()
                line.materialized_contract = contract
                line.sync_status = 'generated'
                line.save(update_fields=['materialized_contract', 'sync_status'])
                generated += 1

        return Response({ 'generated': generated }, status=status.HTTP_200_OK)


class DealLineViewSet(viewsets.ModelViewSet):
    queryset = DealLine.objects.select_related('deal', 'materialized_contract').all()
    serializer_class = DealLineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['deal', 'sync_status']
    ordering = ['delivery_period_start']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a contract"""
        contract = self.get_object()
        if contract.status == 'draft':
            contract.status = 'approved'
            contract.save()
            return Response({'status': 'Contract approved'})
        return Response(
            {'error': 'Contract cannot be approved'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute an approved contract"""
        contract = self.get_object()
        if contract.status == 'approved':
            contract.status = 'executed'
            contract.save()
            return Response({'status': 'Contract executed'})
        return Response(
            {'error': 'Contract cannot be executed'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an executed contract"""
        contract = self.get_object()
        if contract.status == 'executed':
            contract.status = 'completed'
            contract.save()
            return Response({'status': 'Contract completed'})
        return Response(
            {'error': 'Contract cannot be completed'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a contract"""
        contract = self.get_object()
        if contract.status in ['draft', 'approved']:
            contract.status = 'cancelled'
            contract.save()
            return Response({'status': 'Contract cancelled'})
        return Response(
            {'error': 'Contract cannot be cancelled'},
            status=status.HTTP_400_BAD_REQUEST
        )


class TradeSettingViewSet(viewsets.ModelViewSet):
    queryset = Trade_Setting.objects.all()
    serializer_class = TradeSettingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['setting_type', 'is_active']
    search_fields = ['setting_name', 'description']
    ordering = ['setting_name']

    @action(detail=False, methods=['get'])
    def active_settings(self, request):
        """Get only active settings"""
        active_settings = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_settings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a setting"""
        setting = self.get_object()
        setting.is_active = not setting.is_active
        setting.save()
        return Response({
            'status': f'Setting {"activated" if setting.is_active else "deactivated"}',
            'is_active': setting.is_active
        })

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get settings grouped by type"""
        setting_type = request.query_params.get('type')
        if not setting_type:
            return Response(
                {'error': 'type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        settings = self.get_queryset().filter(setting_type=setting_type, is_active=True)
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.select_related('counterparty').all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'counterparty']
    search_fields = ['name', 'email', 'phone', 'position', 'counterparty__counterparty_name']
    ordering = ['name']
