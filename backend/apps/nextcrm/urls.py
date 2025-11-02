"""
URL configuration for NextCRM API endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CurrencyViewSet, CostCenterViewSet, TraderViewSet,
    CommodityGroupViewSet, CommodityTypeViewSet, CommoditySubtypeViewSet,
    CommodityViewSet, CounterpartyViewSet, CounterpartyFacilityViewSet,
    BrokerViewSet, ICOTERMViewSet, DeliveryFormatViewSet,
    AdditiveViewSet, SociedadViewSet, TradeOperationTypeViewSet,
    ContractViewSet, TradeSettingViewSet, ContactViewSet,
    DealViewSet, DealLineViewSet, FacilityConsumptionViewSet, GeocodeView,
    CounterpartyNoteViewSet
)

router = DefaultRouter()

# Register all viewsets
router.register(r'currencies', CurrencyViewSet)
router.register(r'cost-centers', CostCenterViewSet)
router.register(r'traders', TraderViewSet)
router.register(r'commodity-groups', CommodityGroupViewSet)
router.register(r'commodity-types', CommodityTypeViewSet)
router.register(r'commodity-subtypes', CommoditySubtypeViewSet)
router.register(r'commodities', CommodityViewSet)
router.register(r'counterparties', CounterpartyViewSet)
router.register(r'counterparty-facilities', CounterpartyFacilityViewSet)
router.register(r'facility-consumptions', FacilityConsumptionViewSet)
router.register(r'brokers', BrokerViewSet)
router.register(r'icoterms', ICOTERMViewSet)
router.register(r'delivery-formats', DeliveryFormatViewSet)
router.register(r'additives', AdditiveViewSet)
router.register(r'sociedades', SociedadViewSet)
router.register(r'trade-operation-types', TradeOperationTypeViewSet)
router.register(r'trade-settings', TradeSettingViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'deals', DealViewSet)
router.register(r'deal-lines', DealLineViewSet)
router.register(r'counterparty-notes', CounterpartyNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('geocode/', GeocodeView.as_view(), name='geocode'),
]
