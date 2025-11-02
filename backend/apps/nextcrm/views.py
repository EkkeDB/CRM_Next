"""
Django REST Framework views for NextCRM API.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse
import re
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db import transaction, IntegrityError
from django.db.utils import DataError
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncMonth
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.core.exceptions import ValidationError

from .geocoding import geocode_address, GeocodingError

from .models import (
    Currency, Cost_Center, Trader, Commodity_Group, Commodity_Type,
    Commodity_Subtype, Commodity, Counterparty, Broker, ICOTERM,
    Delivery_Format, Additive, Sociedad, Trade_Operation_Type,
    Contract, Counterparty_Facility, Trade_Setting, Contact,
    Deal, DealLine, FacilityConsumption, Counterparty_Note
)
from .serializers import (
    CurrencySerializer, CostCenterSerializer, TraderSerializer,
    CommodityGroupSerializer, CommodityTypeSerializer, CommoditySubtypeSerializer,
    CommoditySerializer, CounterpartySerializer, CounterpartyListSerializer,
    BrokerSerializer, ICOTERMSerializer, DeliveryFormatSerializer,
    AdditiveSerializer, SociedadSerializer, TradeOperationTypeSerializer,
    ContractSerializer, ContractListSerializer, ContractCreateSerializer,
    CounterpartyFacilitySerializer, CounterpartyFacilityDetailSerializer, FacilityConsumptionSerializer,
    DashboardStatsSerializer, TradeSettingSerializer, ContactSerializer,
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

    @action(detail=False, methods=['get'], url_path='bulk_template')
    def bulk_template(self, request):
        """Download an XLSX template for bulk counterparty import."""
        # Build workbook lazily to avoid hard deps in module import
        from openpyxl import Workbook
        from openpyxl.worksheet.datavalidation import DataValidation

        wb = Workbook()
        ws = wb.active
        ws.title = 'Counterparties'
        # Markers: (m) mandatory, (u) unique-key advisable
        headers = [
            'counterparty_name (m)', 'counterparty_code (u)', 'tax_id', 'city', 'country',
            'phone', 'email', 'contact_person', 'is_supplier', 'is_customer'
        ]
        ws.append(headers)
        # Freeze header
        ws.freeze_panes = 'A2'
        # Column widths
        widths = [28, 18, 18, 18, 16, 16, 28, 24, 12, 12]
        for idx, w in enumerate(widths, start=1):
            ws.column_dimensions[chr(64+idx)].width = w

        # Data validation for booleans
        dv = DataValidation(type="list", formula1='"TRUE,FALSE"', allow_blank=True)
        ws.add_data_validation(dv)
        # Apply to is_supplier (I) and is_customer (J) for rows 2..5000
        dv.add('I2:I5000')
        dv2 = DataValidation(type="list", formula1='"TRUE,FALSE"', allow_blank=True)
        ws.add_data_validation(dv2)
        dv2.add('J2:J5000')

        # README sheet
        info = wb.create_sheet('README')
        info.append(['Instructions'])
        info.append(['- Fill rows in the "Counterparties" sheet.'])
        info.append(['- Headers ending with (m) are mandatory; (u) are intended to be unique.'])
        info.append(['- Required: counterparty_name. At least one of is_supplier/is_customer must be TRUE.'])
        info.append(['- Optional fields may be left blank.'])
        info.append(['- Save as .xlsx and upload via /api/counterparties/bulk_upload/'])

        # Render to response
        from io import BytesIO
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        resp = HttpResponse(buf.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        resp['Content-Disposition'] = 'attachment; filename="counterparties_template.xlsx"'
        return resp

    @action(detail=False, methods=['post'], url_path='bulk_upload', parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        """Upload XLSX with counterparties. Returns summary with successes and errors."""
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'file is required (multipart/form-data)'}, status=status.HTTP_400_BAD_REQUEST)

        from openpyxl import load_workbook
        try:
            wb = load_workbook(file, read_only=True, data_only=True)
        except Exception as e:
            return Response({'error': f'Invalid XLSX file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        if 'Counterparties' not in wb.sheetnames:
            # Fallback to first sheet
            ws = wb.active
        else:
            ws = wb['Counterparties']

        # Read header mapping
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return Response({'error': 'Empty worksheet'}, status=status.HTTP_400_BAD_REQUEST)

        raw_header = [str(h).strip() if h is not None else '' for h in rows[0]]

        def norm_col(col: str) -> str:
            s = (col or '').strip().lower()
            # Remove markers like (m) / (u) or any bracketed notes
            s = re.sub(r"\s*\(.*?\)\s*", "", s)
            s = re.sub(r"\s*\[.*?\]\s*", "", s)
            s = s.replace(' ', '_')
            # Allow a few synonyms
            synonyms = {
                'name': 'counterparty_name',
                'code': 'counterparty_code',
                'contact': 'contact_person',
                'customer': 'is_customer',
                'supplier': 'is_supplier',
            }
            return synonyms.get(s, s)

        header = [norm_col(h) for h in raw_header]
        required_cols = ['counterparty_name']
        for rc in required_cols:
            if rc not in header:
                return Response({'error': f'Missing required column: {rc}', 'header': raw_header}, status=status.HTTP_400_BAD_REQUEST)

        created = 0
        updated = 0
        errors = []
        results = []
        text_fields = (
            'counterparty_name', 'counterparty_code', 'tax_id', 'city', 'country',
            'phone', 'email', 'contact_person'
        )
        for idx, row in enumerate(rows[1:], start=2):
            try:
                if not row or all(c in (None, '') for c in row):
                    continue
                data = {header[i]: row[i] for i in range(min(len(header), len(row))) if header[i]}

                # Normalize booleans
                def to_bool(v):
                    if v is None or v == '':
                        return None
                    s = str(v).strip().lower()
                    if s in ('true', '1', 'yes', 'y', 't'): return True
                    if s in ('false', '0', 'no', 'n', 'f'): return False
                    return v  # leave as-is to trigger validation error

                for b in ('is_supplier', 'is_customer'):
                    if b in data:
                        bv = to_bool(data[b])
                        if bv is None:
                            # Omit the field entirely when blank to avoid None validation errors
                            del data[b]
                        else:
                            data[b] = bv

                # If both flags are absent, default to customer=True
                if 'is_supplier' not in data and 'is_customer' not in data:
                    data['is_customer'] = True

                # Normalize text fields safely (coerce numerics to strings and avoid None)
                for f in text_fields:
                    if f in data:
                        v = data[f]
                        data[f] = '' if v is None else str(v).strip()

                # Skip when the mandatory name is missing/blank
                name = (data.get('counterparty_name') or '').strip()
                if not name:
                    errors.append({'row': idx, 'error': 'counterparty_name is required'})
                    continue
                data['counterparty_name'] = name

                # Create or update by counterparty_code if given, else by name (case-insensitive)
                instance = None
                raw_code = data.get('counterparty_code')
                code = str(raw_code).strip() if raw_code not in (None, '') else None
                if code:
                    instance = Counterparty.objects.filter(counterparty_code__iexact=code).first()
                    data['counterparty_code'] = code
                if instance is None:
                    instance = Counterparty.objects.filter(counterparty_name__iexact=name).first()

                if instance:
                    serializer = CounterpartySerializer(instance, data=data, partial=True)
                else:
                    serializer = CounterpartySerializer(data=data)

                if serializer.is_valid():
                    obj = serializer.save()
                    if instance:
                        updated += 1
                        results.append({'row': idx, 'id': obj.id, 'status': 'updated'})
                    else:
                        created += 1
                        results.append({'row': idx, 'id': obj.id, 'status': 'created'})
                else:
                    errors.append({'row': idx, 'error': serializer.errors})
            except Exception as e:
                # Capture unexpected errors per-row instead of 500
                errors.append({'row': idx, 'error': f'Unexpected error: {e}'})

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
            'processed': created + updated + len(errors)
        })


class CounterpartyFacilityViewSet(viewsets.ModelViewSet):
    queryset = Counterparty_Facility.objects.select_related('counterparty').all()
    serializer_class = CounterpartyFacilitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['counterparty', 'facility_type', 'country', 'city', 'province', 'region', 'is_active', 'segment']
    search_fields = ['counterparty_facility_name', 'counterparty__counterparty_name', 'city', 'country']
    ordering = ['counterparty__counterparty_name', 'counterparty_facility_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CounterpartyFacilityDetailSerializer
        return CounterpartyFacilitySerializer

    def _error_response(self, exc):
        detail = str(exc)
        # Provide hints for common issues
        hints = []
        if 'segment' in detail.lower():
            hints.append('Ensure segment is one of the allowed values or empty.')
        if 'null value' in detail.lower():
            hints.append('Check optional fields like segment/latitude/longitude are omitted when empty.')
        return Response({
            'message': 'Save failed',
            'errors': {'non_field_errors': [detail]},
            'hints': hints
        }, status=status.HTTP_400_BAD_REQUEST)

    def _maybe_enrich_with_geocode(self, serializer):
        """If we have enough address info and missing region/province/coords, enrich via geocoding."""
        from decimal import Decimal
        vd = serializer.validated_data
        # Build query string
        parts = [vd.get('address') or '', vd.get('city') or '', vd.get('country') or '']
        query = ', '.join([p for p in parts if p])
        needs = (
            (not vd.get('latitude') or not vd.get('longitude')) or
            (not vd.get('region') or not vd.get('province'))
        )
        if not query or not needs:
            return {}
        try:
            geo = geocode_address(query)
        except Exception:
            return {}
        extra = {}
        if not vd.get('latitude') and isinstance(geo.get('lat'), (int, float)):
            extra['latitude'] = Decimal(str(geo['lat']))
        if not vd.get('longitude') and isinstance(geo.get('lng'), (int, float)):
            extra['longitude'] = Decimal(str(geo['lng']))
        if not vd.get('region') and geo.get('region'):
            extra['region'] = geo['region']
        if not vd.get('province') and geo.get('province'):
            extra['province'] = geo['province']
        return extra

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Validation failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            extra = self._maybe_enrich_with_geocode(serializer)
            self.perform_create(serializer)
            if extra:
                # Persist enrichment after creation (partial update to run model cleanly)
                instance = serializer.instance
                for k, v in extra.items():
                    setattr(instance, k, v)
                instance.save(update_fields=list(extra.keys()))
        except (IntegrityError, DataError) as e:
            return self._error_response(e)
        headers = self.get_success_headers(serializer.data)
        # Reload to include enrichment
        return Response(self.get_serializer(serializer.instance).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response({'message': 'Validation failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_update(serializer)
            # Post-update enrichment if still missing
            extra = self._maybe_enrich_with_geocode(serializer)
            if extra:
                inst = self.get_object()
                for k, v in extra.items():
                    setattr(inst, k, v)
                inst.save(update_fields=list(extra.keys()))
        except (IntegrityError, DataError) as e:
            return self._error_response(e)
        return Response(self.get_serializer(self.get_object()).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class FacilityConsumptionViewSet(viewsets.ModelViewSet):
    queryset = FacilityConsumption.objects.select_related('facility', 'commodity').all()
    serializer_class = FacilityConsumptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['facility', 'commodity']
    ordering = ['commodity']

    def _error_response(self, exc):
        return Response({
            'message': 'Save failed',
            'errors': {'non_field_errors': [str(exc)]},
        }, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Validation failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_create(serializer)
        except (IntegrityError, DataError) as e:
            return self._error_response(e)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response({'message': 'Validation failed', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_update(serializer)
        except (IntegrityError, DataError) as e:
            return self._error_response(e)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class GeocodeView(APIView):
    """Geocode an address string and return lat/lng (cached)."""
    permission_classes = [IsAuthenticated]

    @method_decorator(ratelimit(key='ip', rate='30/m', method='GET'))
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'error': 'q parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            raw = request.query_params.get('raw') in ('1', 'true', 'yes')
            result = geocode_address(q, return_raw=raw)
            return Response(result)
        except GeocodingError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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


class CounterpartyNoteViewSet(viewsets.ModelViewSet):
    queryset = Counterparty_Note.objects.select_related('counterparty').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['counterparty']
    ordering = ['-created_at']

    def get_serializer_class(self):
        from .serializers import CounterpartyNoteSerializer
        return CounterpartyNoteSerializer

    def perform_create(self, serializer):
        try:
            serializer.save()
        except ValidationError as e:
            raise e
