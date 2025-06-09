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
    ContractViewSet
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
router.register(r'brokers', BrokerViewSet)
router.register(r'icoterms', ICOTERMViewSet)
router.register(r'delivery-formats', DeliveryFormatViewSet)
router.register(r'additives', AdditiveViewSet)
router.register(r'sociedades', SociedadViewSet)
router.register(r'trade-operation-types', TradeOperationTypeViewSet)
router.register(r'contracts', ContractViewSet)

urlpatterns = [
    path('', include(router.urls)),
]