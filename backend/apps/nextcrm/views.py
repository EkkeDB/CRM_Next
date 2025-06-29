"""
Django REST Framework views for NextCRM API.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility, Trade_Setting
)
from .serializers import (
    CurrencySerializer, CostCenterSerializer, TraderSerializer,
    CommodityGroupSerializer, CommodityTypeSerializer, CommoditySubtypeSerializer,
    CommoditySerializer, CounterpartySerializer, CounterpartyListSerializer,
    BrokerSerializer, ICOTERMSerializer, DeliveryFormatSerializer,
    AdditiveSerializer, SociedadSerializer, TradeOperationTypeSerializer,
    ContractSerializer, ContractListSerializer, ContractCreateSerializer,
    CounterpartyFacilitySerializer, DashboardStatsSerializer, TradeSettingSerializer
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
    search_fields = ['commodity_type_name']
    ordering = ['commodity_type_name']


class CommoditySubtypeViewSet(viewsets.ModelViewSet):
    queryset = Commodity_Subtype.objects.all()
    serializer_class = CommoditySubtypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['commodity_subtype_name']
    ordering = ['commodity_subtype_name']


class CommodityViewSet(viewsets.ModelViewSet):
    queryset = Commodity.objects.select_related(
        'commodity_subtype__commodity_type__commodity_group'
    ).all()
    serializer_class = CommoditySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['commodity_subtype', 'commodity_subtype__commodity_type', 'commodity_subtype__commodity_type__commodity_group']
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['trade_operation_type_name', 'operation_code']
    ordering = ['trade_operation_type_name']


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related(
        'trader', 'counterparty', 'commodity__commodity_subtype__commodity_type__commodity_group', 
        'broker', 'trade_currency', 'broker_fee_currency'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'status', 'trader', 'counterparty', 'commodity',
        'commodity__commodity_subtype__commodity_type__commodity_group',
        'trade_operation_type', 'date'
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

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        # Basic stats
        total_contracts = Contract.objects.count()
        total_value = Contract.objects.aggregate(
            total=Sum('price')
        )['total'] or 0
        
        active_contracts = Contract.objects.filter(
            status__in=['approved', 'executed']
        ).count()
        
        pending_contracts = Contract.objects.filter(status='draft').count()
        
        # Top counterparties by contract value
        top_counterparties = list(
            Contract.objects.values('counterparty__counterparty_name')
            .annotate(total_value=Sum('price'), contract_count=Count('id'))
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
            .extra({'month': 'date_trunc(\'month\', date)'})
            .values('month')
            .annotate(total_value=Sum('price'), contract_count=Count('id'))
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