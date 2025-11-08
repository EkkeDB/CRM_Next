from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from typing import Tuple

from django.contrib.auth.models import AnonymousUser
from .policy import resolve_policy, check_allowed


class ScopedPermission(BasePermission):
    """Coarse-grained permission check using resolved policy (RBAC token).

    Deny-by-default: if no mapping is found for the action, deny with message.
    """

    # Map ViewSet class names and DRF actions to resource:action tokens
    ACTION_MAP = {
        'ContractViewSet': {
            'list': ('contracts', 'read'),
            'retrieve': ('contracts', 'read'),
            'create': ('contracts', 'write'),
            'update': ('contracts', 'write'),
            'partial_update': ('contracts', 'write'),
            'destroy': ('contracts', 'write'),
            'bulk_template': ('exports', 'run'),
            'bulk_upload': ('contracts', 'write'),
            'dashboard_stats': ('contracts', 'read'),
            'export': ('exports', 'run'),
            'field_catalog': ('contracts', 'read'),
        },
        'DealViewSet': {
            'list': ('deals', 'read'),
            'retrieve': ('deals', 'read'),
            'create': ('deals', 'write'),
            'update': ('deals', 'write'),
            'partial_update': ('deals', 'write'),
            'destroy': ('deals', 'write'),
            'generate_contracts': ('deals', 'write'),
        },
        'CounterpartyViewSet': {
            'list': ('counterparties', 'read'),
            'retrieve': ('counterparties', 'read'),
            'create': ('counterparties', 'write'),
            'update': ('counterparties', 'write'),
            'partial_update': ('counterparties', 'write'),
            'destroy': ('counterparties', 'write'),
            'bulk_template': ('exports', 'run'),
            'bulk_upload': ('counterparties', 'write'),
        },
        'ContactViewSet': {
            'list': ('contacts', 'read'),
            'retrieve': ('contacts', 'read'),
            'create': ('contacts', 'write'),
            'update': ('contacts', 'write'),
            'partial_update': ('contacts', 'write'),
            'destroy': ('contacts', 'write'),
        },
        'DealLineViewSet': {
            'list': ('deals', 'read'),
            'retrieve': ('deals', 'read'),
            'create': ('deals', 'write'),
            'update': ('deals', 'write'),
            'partial_update': ('deals', 'write'),
            'destroy': ('deals', 'write'),
        },
        'CounterpartyNoteViewSet': {
            'list': ('counterparties', 'read'),
            'retrieve': ('counterparties', 'read'),
            'create': ('counterparties', 'write'),
            'update': ('counterparties', 'write'),
            'partial_update': ('counterparties', 'write'),
            'destroy': ('counterparties', 'write'),
        },
        'TradeSettingViewSet': {
            'list': ('settings', 'read'),
            'retrieve': ('settings', 'read'),
            'create': ('settings', 'write'),
            'update': ('settings', 'write'),
            'partial_update': ('settings', 'write'),
            'destroy': ('settings', 'write'),
        },
    }

    def _map(self, view) -> Tuple[str, str]:
        view_name = view.__class__.__name__
        action = getattr(view, 'action', None)
        mapping = self.ACTION_MAP.get(view_name, {})
        if action in mapping:
            return mapping[action]
        # If no action (APIView) try method mapping (GET->read, POST->write)
        method = getattr(view.request, 'method', '').upper()
        if method == 'GET':
            return (view_name.replace('ViewSet', '').lower(), 'read')
        if method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return (view_name.replace('ViewSet', '').lower(), 'write')
        return ('', '')

    def has_permission(self, request, view):
        user = request.user
        if isinstance(user, AnonymousUser) or not user.is_authenticated:
            return False
        # Superuser bypass: full access for administrators
        if getattr(user, 'is_superuser', False):
            setattr(request, 'resolved_policy', {'permissions': ['*']})
            return True
        resource, action = self._map(view)
        if not resource or not action:
            raise PermissionDenied(detail=f"authorization mapping missing for {view.__class__.__name__}.{getattr(view, 'action', None)}")
        policy = resolve_policy(user)
        allowed, reason = check_allowed(policy, resource, action)
        if not allowed:
            raise PermissionDenied(detail=f"Forbidden: {reason}")
        # Attach policy to request for downstream queryset/serializer
        setattr(request, 'resolved_policy', policy)
        return True
