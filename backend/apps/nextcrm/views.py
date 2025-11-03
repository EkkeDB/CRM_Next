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
        info.append(['- Duplicate names are allowed when counterparty_code differs (code is authoritative).'])
        info.append(['- If counterparty_code is provided and not found, a NEW record is created (no fallback to name).'])

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

                # Option A: code-authoritative behavior
                # If counterparty_code is provided and found -> update that record.
                # If counterparty_code is provided and NOT found -> create a NEW record (no fallback to name).
                # If no code provided -> fallback to name (update if found, else create).
                instance = None
                raw_code = data.get('counterparty_code')
                code = str(raw_code).strip() if raw_code not in (None, '') else None
                if code:
                    instance = Counterparty.objects.filter(counterparty_code__iexact=code).first()
                    data['counterparty_code'] = code
                else:
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

        # Optional: return CSV of errors when requested (useful for dry-run)
        want_csv = request.query_params.get('errors_format', '').lower() == 'csv' or request.query_params.get('format', '').lower() == 'csv'
        if want_csv:
            import csv
            from io import StringIO
            def _fmt_err(e):
                if isinstance(e, dict):
                    parts = []
                    for k, v in e.items():
                        if isinstance(v, (list, tuple)):
                            parts.append(f"{k}: {'; '.join(map(str, v))}")
                        else:
                            parts.append(f"{k}: {v}")
                    return ' | '.join(parts)
                return str(e)
            buf = StringIO()
            writer = csv.writer(buf)
            writer.writerow(['row', 'error'])
            for item in errors:
                writer.writerow([item.get('row'), _fmt_err(item.get('error'))])
            csv_bytes = buf.getvalue().encode('utf-8')
            resp = HttpResponse(csv_bytes, content_type='text/csv')
            resp['Content-Disposition'] = 'attachment; filename="counterparties_dry_run_errors.csv"'
            return resp

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

    @action(detail=False, methods=['get'], url_path='bulk_template')
    def bulk_template(self, request):
        """Download an XLSX template for bulk contracts import.

        One row = one Contract. Optional `deal_number` links a contract to an existing or new Deal header.
        """
        from openpyxl import Workbook
        from openpyxl.utils import get_column_letter
        from openpyxl.worksheet.datavalidation import DataValidation

        wb = Workbook()
        ws = wb.active
        ws.title = 'Contracts'
        # Mark mandatory fields with '*', note (u) for unique key
        headers = [
            'deal_number*', 'contract_number (u)', 'trader*', 'trade_operation_type*', 'sociedad*',
            'counterparty_code*', 'commodity*', 'delivery_format*', 'additive*', 'broker', 'icoterm*', 'cost_center*',
            'broker_fee', 'broker_fee_currency', 'freight_cost*', 'forex*', 'price*', 'trade_currency*',
            'payment_days*', 'quantity*', 'unit_of_measure*', 'entrega*',
            'delivery_period_start*', 'delivery_period_end*', 'delivery_period',
            'date*', 'status*', 'notes'
        ]
        ws.append(headers)
        ws.freeze_panes = 'A2'
        widths = [16, 20, 18, 20, 18, 24, 20, 18, 16, 16, 12, 16, 12, 12, 12, 10, 12, 12, 12, 12, 12, 18, 16, 16, 14, 12, 12, 24]
        for idx, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(idx)].width = w

        info = wb.create_sheet('README')
        info.append(['Instructions'])
        info.append(['- One row per contract; fields marked * are mandatory.'])
        info.append(['- Use codes where available (counterparty_code, currency codes, icoterm codes) to reduce ambiguity.'])
        info.append(['- Dates format: YYYY-MM-DD.'])
        info.append(['- deal_number is mandatory; if the deal does not exist, it will be created.'])
        info.append(['- delivery_period_start and delivery_period_end are mandatory; start must not be after end.'])
        info.append(['- If an existing DealLine already points to a contract, a new line will be appended (no overwrite).'])

        # Build OPTIONS sheet with dropdown values for most FK fields (except counterparty)
        from .models import (
            Trader, Trade_Operation_Type, Sociedad, Commodity, Delivery_Format, Additive,
            Broker, ICOTERM, Cost_Center, Currency, Contract
        )
        opt = wb.create_sheet('OPTIONS')
        # Build unit_of_measure options from DB distincts with safe fallbacks
        uom_set = set()
        try:
            uom_set.update([v for v in Commodity.objects.values_list('unit_of_measure', flat=True).distinct() if v])
        except Exception:
            pass
        try:
            uom_set.update([v for v in Contract.objects.values_list('unit_of_measure', flat=True).distinct() if v])
        except Exception:
            pass
        # Ensure basic common units are present
        uom_set.update(['MT', 'KG'])
        uoms = sorted(uom_set)

        option_defs = [
            ('trader', [t.trader_name for t in Trader.objects.order_by('trader_name')]),
            ('trade_operation_type', [o.trade_operation_type_name for o in Trade_Operation_Type.objects.order_by('trade_operation_type_name')]),
            ('sociedad', [s.sociedad_name for s in Sociedad.objects.order_by('sociedad_name')]),
            ('commodity', [c.commodity_name_short for c in Commodity.objects.order_by('commodity_name_short')]),
            ('delivery_format', [d.delivery_format_name for d in Delivery_Format.objects.order_by('delivery_format_name')]),
            ('additive', [a.additive_name for a in Additive.objects.order_by('additive_name')]),
            ('broker', [b.broker_name for b in Broker.objects.order_by('broker_name')]),
            ('icoterm', [i.icoterm_code for i in ICOTERM.objects.order_by('icoterm_code')]),
            ('cost_center', [cc.cost_center_name for cc in Cost_Center.objects.order_by('cost_center_name')]),
            ('currency', [c.currency_code for c in Currency.objects.order_by('currency_code')]),
            ('status', [k for (k, _) in Contract.STATUS_CHOICES]),
            ('unit_of_measure', uoms),
        ]
        # Write option columns
        for col_idx, (name, values) in enumerate(option_defs, start=1):
            opt.cell(row=1, column=col_idx, value=name)
            for row_idx, val in enumerate(values, start=2):
                opt.cell(row=row_idx, column=col_idx, value=val)
        # Hide options sheet from users
        opt.sheet_state = 'hidden'

        # Map headers in Contracts sheet to fields and apply validations
        header_cells = {ws.cell(row=1, column=i).value: i for i in range(1, ws.max_column + 1)}
        field_to_header = {
            'trader': 'trader*',
            'trade_operation_type': 'trade_operation_type*',
            'sociedad': 'sociedad*',
            'commodity': 'commodity*',
            'delivery_format': 'delivery_format*',
            'additive': 'additive*',
            'broker': 'broker',
            'icoterm': 'icoterm*',
            'cost_center': 'cost_center*',
            'trade_currency': 'trade_currency*',
            'broker_fee_currency': 'broker_fee_currency',
            'status': 'status*',
            'unit_of_measure': 'unit_of_measure*',
        }
        # Options lookup mapping
        opt_col_for = {name: get_column_letter(idx) for idx, (name, _) in enumerate(option_defs, start=1)}
        def apply_dropdown(field_name: str, opt_key: str | None = None):
            header_text = field_to_header.get(field_name)
            if not header_text or header_text not in header_cells:
                return
            main_col = get_column_letter(header_cells[header_text])
            source_key = opt_key or (field_name if field_name in opt_col_for else None)
            if not source_key or source_key not in opt_col_for:
                return
            src_col = opt_col_for[source_key]
            # Determine last row in source (fallback to a large range)
            # We’ll use rows 2..2000 for safety
            formula = f"=OPTIONS!${src_col}$2:${src_col}$2000"
            dv = DataValidation(type="list", formula1=formula, allow_blank=True)
            ws.add_data_validation(dv)
            dv.add(f"{main_col}2:{main_col}5000")

        # Apply dropdowns
        apply_dropdown('trader')
        apply_dropdown('trade_operation_type')
        apply_dropdown('sociedad')
        apply_dropdown('commodity')
        apply_dropdown('delivery_format')
        apply_dropdown('additive')
        apply_dropdown('broker')
        apply_dropdown('icoterm')
        apply_dropdown('cost_center')
        apply_dropdown('trade_currency', opt_key='currency')
        apply_dropdown('broker_fee_currency', opt_key='currency')
        apply_dropdown('status')
        apply_dropdown('unit_of_measure')

        from io import BytesIO
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        resp = HttpResponse(buf.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        resp['Content-Disposition'] = 'attachment; filename="contracts_template.xlsx"'
        return resp

    @action(detail=False, methods=['post'], url_path='bulk_upload', parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        """Upload XLSX with contracts. Creates/updates Contracts, optionally links/creates Deals and DealLines.

        Query params (optional):
          - create_missing_deal: bool (default true)
          - replace_materialized: bool (default false)
          - dry_run: bool (default false) — validate and simulate without saving
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'file is required (multipart/form-data)'}, status=status.HTTP_400_BAD_REQUEST)

        from openpyxl import load_workbook
        try:
            wb = load_workbook(file, read_only=True, data_only=True)
        except Exception as e:
            return Response({'error': f'Invalid XLSX file: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return Response({'error': 'Empty worksheet'}, status=status.HTTP_400_BAD_REQUEST)

        raw_header = [str(h).strip() if h is not None else '' for h in rows[0]]

        import re
        def norm_col(col: str) -> str:
            s = (col or '').strip().lower()
            s = re.sub(r"\s*\(.*?\)\s*", "", s)
            s = re.sub(r"\s*\[.*?\]\s*", "", s)
            s = s.replace(' ', '_')
            s = s.replace('*', '')
            synonyms = {
                'trader_name': 'trader',
                'counterparty_name': 'counterparty',
                'counterparty_code': 'counterparty_code',
                'commodity_name': 'commodity',
                'commodity_name_short': 'commodity',
                'currency': 'trade_currency',
                'broker_fee_ccy': 'broker_fee_currency',
                'delivery_start': 'delivery_period_start',
                'delivery_end': 'delivery_period_end',
            }
            return synonyms.get(s, s)

        header = [norm_col(h) for h in raw_header]

        # Basic helpers to resolve related objects
        from .models import (
            Trader, Trade_Operation_Type, Sociedad, Counterparty, Commodity,
            Delivery_Format, Additive, Broker, ICOTERM, Cost_Center, Currency,
            Deal, DealLine
        )

        def get_currency(val):
            if not val:
                return None
            code = str(val).strip().upper()
            return Currency.objects.filter(currency_code__iexact=code).first()

        def get_by_name(model, field, val):
            if not val:
                return None
            return model.objects.filter(**{f"{field}__iexact": str(val).strip()}).first()

        created, updated = 0, 0
        errors = []
        results = []

        # Params
        create_missing_deal = (request.query_params.get('create_missing_deal', 'true').lower() != 'false')
        replace_materialized = (request.query_params.get('replace_materialized', 'false').lower() == 'true')
        dry_run = (request.query_params.get('dry_run', 'false').lower() == 'true')

        # Preview support: limit to first N rows and return a plan summary
        try:
            preview_rows = int(request.query_params.get('preview_rows', '0') or '0')
        except Exception:
            preview_rows = 0
        preview_mode = preview_rows > 0
        preview_items = []
        p_contract_create = p_contract_update = 0
        p_deal_create = 0
        p_line_create = p_line_link = p_line_append = p_line_replace = 0

        # Iterate rows
        for idx, row in enumerate(rows[1:], start=2):
            try:
                if not row or all(c in (None, '') for c in row):
                    continue
                data = {header[i]: row[i] for i in range(min(len(header), len(row))) if header[i]}
                row_plan = {'row': idx, 'contract_action': None, 'deal_action': None, 'line_action': None, 'problems': []}

                # Normalize basic scalars
                def val_s(v):
                    return '' if v is None else str(v).strip()
                def val_d(v):
                    from decimal import Decimal
                    if v in (None, ''):
                        return None
                    try:
                        return Decimal(str(v))
                    except Exception:
                        return v

                # Required core fields
                trader = get_by_name(Trader, 'trader_name', data.get('trader'))
                # Prefer code if provided, fallback to name (legacy)
                cp_code = val_s(data.get('counterparty_code'))
                counterparty = None
                if cp_code:
                    counterparty = Counterparty.objects.filter(counterparty_code__iexact=cp_code).first()
                if not counterparty:
                    counterparty = get_by_name(Counterparty, 'counterparty_name', data.get('counterparty')) or Counterparty.objects.filter(counterparty_code__iexact=val_s(data.get('counterparty'))).first()
                commodity = get_by_name(Commodity, 'commodity_name_short', data.get('commodity')) or get_by_name(Commodity, 'commodity_name_full', data.get('commodity'))
                trade_currency = get_currency(data.get('trade_currency'))
                if not (trader and counterparty and commodity and trade_currency):
                    # Provide detailed diagnostics for CSV export
                    missing = {}
                    if not trader:
                        missing['trader'] = f"not found: {val_s(data.get('trader')) or '(blank)'}"
                    if not counterparty:
                        missing['counterparty'] = f"not found by code: {cp_code or '(none)'}; name: {val_s(data.get('counterparty')) or '(none)'}"
                    if not commodity:
                        missing['commodity'] = f"not found: {val_s(data.get('commodity')) or '(blank)'}"
                    if not trade_currency:
                        missing['trade_currency'] = f"invalid code: {val_s(data.get('trade_currency')) or '(blank)'}"
                    errors.append({'row': idx, 'error': missing or 'Missing or invalid trader/counterparty/commodity/trade_currency'})
                    if preview_mode:
                        row_plan['contract_action'] = 'error'
                        row_plan['problems'].append('Missing or invalid trader/counterparty/commodity/trade_currency')
                        preview_items.append(row_plan)
                    continue

                # Optional relations
                sociedad = get_by_name(Sociedad, 'sociedad_name', data.get('sociedad'))
                tot = get_by_name(Trade_Operation_Type, 'trade_operation_type_name', data.get('trade_operation_type'))
                delivery_format = get_by_name(Delivery_Format, 'delivery_format_name', data.get('delivery_format'))
                additive = get_by_name(Additive, 'additive_name', data.get('additive'))
                broker = get_by_name(Broker, 'broker_name', data.get('broker')) or Broker.objects.filter(broker_code__iexact=val_s(data.get('broker'))).first()
                icoterm = get_by_name(ICOTERM, 'icoterm_name', data.get('icoterm')) or ICOTERM.objects.filter(icoterm_code__iexact=val_s(data.get('icoterm'))).first()
                cost_center = get_by_name(Cost_Center, 'cost_center_name', data.get('cost_center'))

                # Numerics
                broker_fee = val_d(data.get('broker_fee')) or 0
                broker_fee_currency = get_currency(data.get('broker_fee_currency')) or trade_currency
                freight_cost = val_d(data.get('freight_cost'))
                forex = val_d(data.get('forex'))
                price = val_d(data.get('price'))
                quantity = val_d(data.get('quantity'))

                # Strings/dates
                uom = val_s(data.get('unit_of_measure'))
                entrega = val_s(data.get('entrega'))
                from datetime import datetime
                def parse_date(v):
                    if not v:
                        return None
                    if hasattr(v, 'strftime'):
                        return v
                    try:
                        return datetime.strptime(str(v).strip(), '%Y-%m-%d').date()
                    except Exception:
                        return None
                dps = parse_date(data.get('delivery_period_start'))
                dpe = parse_date(data.get('delivery_period_end'))
                delivery_period = parse_date(data.get('delivery_period'))
                # True ranges: require start and end; fallback to legacy single date by mapping to both
                if dps or dpe:
                    if not (dps and dpe):
                        errors.append({'row': idx, 'error': 'Both delivery_period_start and delivery_period_end are required'})
                        continue
                    # keep delivery_period as start for backward-compat consumers
                    delivery_period = dps
                elif delivery_period:
                    dps = delivery_period
                    dpe = delivery_period
                contract_date = parse_date(data.get('date'))
                status_val = val_s(data.get('status')) or 'draft'
                notes = val_s(data.get('notes'))

                # Mandatory relations per specification
                mandatory_missing = []
                if not val_s(data.get('deal_number')):
                    mandatory_missing.append('deal_number')
                if not get_by_name(Trade_Operation_Type, 'trade_operation_type_name', data.get('trade_operation_type')):
                    mandatory_missing.append('trade_operation_type')
                if not get_by_name(Sociedad, 'sociedad_name', data.get('sociedad')):
                    mandatory_missing.append('sociedad')
                if not get_by_name(Delivery_Format, 'delivery_format_name', data.get('delivery_format')):
                    mandatory_missing.append('delivery_format')
                if not get_by_name(Additive, 'additive_name', data.get('additive')):
                    mandatory_missing.append('additive')
                if not (get_by_name(ICOTERM, 'icoterm_name', data.get('icoterm')) or ICOTERM.objects.filter(icoterm_code__iexact=val_s(data.get('icoterm'))).first()):
                    mandatory_missing.append('icoterm')
                if not get_by_name(Cost_Center, 'cost_center_name', data.get('cost_center')):
                    mandatory_missing.append('cost_center')
                if freight_cost is None:
                    mandatory_missing.append('freight_cost')
                if forex is None:
                    mandatory_missing.append('forex')
                if price is None:
                    mandatory_missing.append('price')
                if quantity is None:
                    mandatory_missing.append('quantity')
                if not uom:
                    mandatory_missing.append('unit_of_measure')
                if not entrega:
                    mandatory_missing.append('entrega')
                if not (dps and dpe):
                    mandatory_missing.append('delivery_period_start/end')
                if not contract_date:
                    mandatory_missing.append('date')
                if not val_s(data.get('status')):
                    mandatory_missing.append('status')
                if mandatory_missing:
                    msg = f"Missing mandatory fields: {', '.join(mandatory_missing)}"
                    errors.append({'row': idx, 'error': msg})
                    if preview_mode:
                        row_plan['contract_action'] = 'error'
                        row_plan['problems'].append(msg)
                        preview_items.append(row_plan)
                    continue

                # Resolve/ensure Deal before creating/updating Contract, so we can link at creation time
                deal = None
                deal_number = val_s(data.get('deal_number'))
                if deal_number:
                    deal = Deal.objects.filter(deal_number__iexact=deal_number).first()
                    if not deal and create_missing_deal:
                        # Build minimal Deal header from row (broker optional; other fields validated above)
                        deal = Deal(
                            deal_number=deal_number,
                            trader=trader,
                            counterparty=counterparty,
                            commodity=commodity,
                            price=price,
                            trade_currency=trade_currency,
                            payment_days=int(val_s(data.get('payment_days')) or '0') or 0,
                            unit_of_measure=uom,
                            broker_fee=broker_fee,
                            broker_fee_currency=broker_fee_currency,
                            freight_cost=freight_cost,
                            forex=forex,
                            date=contract_date,
                            status=status_val,
                            sociedad=sociedad,
                            trade_operation_type=tot,
                            delivery_format=delivery_format,
                            additive=additive,
                            broker=broker,
                            icoterm=icoterm,
                            cost_center=cost_center,
                            notes=notes,
                        )
                        if not dry_run:
                            try:
                                deal.save()
                            except Exception as e:
                                errors.append({'row': idx, 'error': f'Failed to create deal {deal_number}: {e}'})
                                continue

                # Find or create Contract by contract_number
                contract_number = val_s(data.get('contract_number'))
                contract = None
                if contract_number:
                    contract = Contract.objects.filter(contract_number__iexact=contract_number).first()

                payload = {
                    'trader': trader,
                    'trade_operation_type': tot,
                    'sociedad': sociedad,
                    'counterparty': counterparty,
                    'commodity': commodity,
                    'delivery_format': delivery_format,
                    'additive': additive,
                    'broker': broker,
                    'icoterm': icoterm,
                    'cost_center': cost_center,
                    'broker_fee': broker_fee,
                    'broker_fee_currency': broker_fee_currency,
                    'freight_cost': freight_cost,
                    'forex': forex,
                    'price': price,
                    'trade_currency': trade_currency,
                    'payment_days': int(val_s(data.get('payment_days')) or '0') or 0,
                    'quantity': quantity,
                    'unit_of_measure': uom,
                    'entrega': entrega,
                    'delivery_period': dps,
                    'delivery_period_start': dps,
                    'delivery_period_end': dpe,
                    'date': contract_date,
                    'status': status_val if status_val in dict(Contract.STATUS_CHOICES) else 'draft',
                    'notes': notes,
                    'deal': (deal if (deal and not dry_run and getattr(deal, 'pk', None)) else None),
                }

                # Save contract
                op = 'created'
                if contract:
                    for k, v in payload.items():
                        setattr(contract, k, v)
                    if contract_number:
                        contract.contract_number = contract_number
                    if not dry_run:
                        contract.save()
                    updated += 1
                    op = 'updated'
                else:
                    contract = Contract(**payload)
                    if contract_number:
                        contract.contract_number = contract_number
                    if not dry_run:
                        contract.save()
                    created += 1

                # Preview counters for contract action
                if preview_mode:
                    if contract:
                        p_contract_update += 1
                        row_plan['contract_action'] = 'update'
                    else:
                        p_contract_create += 1
                        row_plan['contract_action'] = 'create'

                # Deal linkage for DealLine (use true start/end range) if a deal exists
                if deal_number and (deal or Deal.objects.filter(deal_number__iexact=deal_number).exists()):
                    # DealLine linking (use true start/end range) without referencing unsaved Deal in filters
                    line = None
                    if deal and getattr(deal, 'pk', None):
                        line = DealLine.objects.filter(deal=deal, delivery_period_start=dps, delivery_period_end=dpe).first()
                    else:
                        # Dry-run or unsaved Deal: try by deal_number to avoid unsaved instance in filter
                        line = DealLine.objects.filter(deal__deal_number__iexact=deal_number, delivery_period_start=dps, delivery_period_end=dpe).first()
                    if line and line.materialized_contract and line.materialized_contract_id != contract.id:
                        if replace_materialized:
                            if not dry_run:
                                line.materialized_contract = contract
                                line.sync_status = 'synced'
                                line.save(update_fields=['materialized_contract', 'sync_status'])
                            if preview_mode:
                                p_line_replace += 1
                                row_plan['line_action'] = 'replace'
                        else:
                            # Append new line for this period range
                            if not dry_run:
                                line = DealLine.objects.create(
                                    deal=deal,
                                    delivery_period_start=dps,
                                    delivery_period_end=dpe,
                                    materialized_contract=contract,
                                    sync_status='synced'
                                )
                            if preview_mode:
                                p_line_append += 1
                                row_plan['line_action'] = 'append'
                    elif line:
                        # Link if empty
                        if not line.materialized_contract_id:
                            if not dry_run:
                                line.materialized_contract = contract
                                line.sync_status = 'synced'
                                line.save(update_fields=['materialized_contract', 'sync_status'])
                            if preview_mode:
                                p_line_link += 1
                                row_plan['line_action'] = 'link'
                    else:
                        if not dry_run:
                            DealLine.objects.create(
                                deal=deal,
                                delivery_period_start=dps,
                                delivery_period_end=dpe,
                                materialized_contract=contract,
                                sync_status='synced'
                            )
                        if preview_mode:
                            p_line_create += 1
                            row_plan['line_action'] = 'create'

                results.append({'row': idx, 'id': contract.id, 'status': op})
                if preview_mode:
                    # Deal action determination
                    if deal_number:
                        exists = Deal.objects.filter(deal_number__iexact=deal_number).exists()
                        if not exists and create_missing_deal:
                            p_deal_create += 1
                            row_plan['deal_action'] = row_plan['deal_action'] or 'create'
                        elif exists:
                            row_plan['deal_action'] = row_plan['deal_action'] or 'existing'
                    preview_items.append(row_plan)
            except Exception as e:
                errors.append({'row': idx, 'error': f'Unexpected error: {e}'})
                if preview_mode:
                    row_plan['contract_action'] = row_plan['contract_action'] or 'error'
                    row_plan['problems'].append(str(e))
                    preview_items.append(row_plan)
            finally:
                if preview_mode and len(preview_items) >= preview_rows:
                    break

        # Optional CSV export of errors (handy for dry-run validation reports)
        want_csv = request.query_params.get('errors_format', '').lower() == 'csv' or request.query_params.get('format', '').lower() == 'csv'
        if want_csv:
            import csv
            from io import StringIO
            def _fmt_err(e):
                if isinstance(e, dict):
                    parts = []
                    for k, v in e.items():
                        if isinstance(v, (list, tuple)):
                            parts.append(f"{k}: {'; '.join(map(str, v))}")
                        else:
                            parts.append(f"{k}: {v}")
                    return ' | '.join(parts)
                return str(e)
            buf = StringIO()
            writer = csv.writer(buf)
            writer.writerow(['row', 'error'])
            for item in errors:
                writer.writerow([item.get('row'), _fmt_err(item.get('error'))])
            csv_bytes = buf.getvalue().encode('utf-8')
            resp = HttpResponse(csv_bytes, content_type='text/csv')
            resp['Content-Disposition'] = 'attachment; filename="contracts_dry_run_errors.csv"'
            return resp

        resp = {
            'created': created,
            'updated': updated,
            'errors': errors,
            'processed': created + updated + len(errors),
            'dry_run': dry_run,
        }
        if preview_mode:
            resp['preview'] = {
                'rows': preview_items,
                'summary': {
                    'willCreateContracts': p_contract_create,
                    'willUpdateContracts': p_contract_update,
                    'willCreateDeals': p_deal_create,
                    'lineActions': {
                        'create': p_line_create,
                        'link': p_line_link,
                        'append': p_line_append,
                        'replace': p_line_replace,
                    }
                }
            }
        return Response(resp)

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
                    delivery_period_start=line.delivery_period_start,
                    delivery_period_end=line.delivery_period_end,
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

