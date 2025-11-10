from __future__ import annotations
from typing import Any, Dict, Optional, Sequence, Tuple
from datetime import date

from django.db.models import QuerySet, Q


def _parse_ints(vals: Sequence[Any]) -> list[int]:
    out = []
    for v in vals:
        try:
            out.append(int(v))
        except Exception:
            continue
    return out


def _parse_strs(vals: Sequence[Any]) -> list[str]:
    return [str(v) for v in vals if v not in (None, '')]


def _ids_names(vals: Sequence[Any]) -> Tuple[list[int], list[str]]:
    ids = _parse_ints(vals)
    names = [str(v) for v in vals if v not in (None, '')]
    # Remove items that parsed as ints from names to avoid duplicates
    names = [n for n in names if not n.isdigit() or int(n) not in ids]
    return ids, names


def scope_queryset(resource: str, qs: QuerySet, policy: Dict[str, Any]) -> QuerySet:
    """Apply attribute constraints to the queryset based on the resolved policy.

    Supported resources: 'contracts', 'deals', 'counterparties'.
    Constraints: centers (ids), commodities (ids or names), date_window (on 'date').
    """
    if not policy:
        return qs
    centers = policy.get('centers')  # list[int] or None
    commodities = policy.get('commodities')  # list[str]|None (ids or names)
    dw = policy.get('date_window')  # {from,to}|None

    if resource == 'contracts':
        if centers:
            ids = _parse_ints(centers)
            if ids:
                qs = qs.filter(cost_center_id__in=ids)
        if commodities:
            # Split into ids and names
            ids, names = _ids_names(commodities)
            cond = Q()
            if ids:
                cond |= Q(commodity_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_name_short__in=names)
            if cond:
                qs = qs.filter(cond)
        # Commodity Groups
        groups = policy.get('commodity_groups')
        if groups:
            ids, names = _ids_names(groups)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_group_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_group__commodity_group_name__in=names)
            if cond:
                qs = qs.filter(cond)
        # Commodity Types
        types = policy.get('commodity_types')
        if types:
            ids, names = _ids_names(types)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_type_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_type__commodity_type_name__in=names)
            if cond:
                qs = qs.filter(cond)
        # Commodity Subtypes
        subtypes = policy.get('commodity_subtypes')
        if subtypes:
            ids, names = _ids_names(subtypes)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_subtype_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_subtype__commodity_subtype_name__in=names)
            if cond:
                qs = qs.filter(cond)
        # Sociedades
        sociedades = policy.get('sociedades')
        if sociedades:
            ids, names = _ids_names(sociedades)
            cond = Q()
            if ids:
                cond |= Q(sociedad_id__in=ids)
            if names:
                cond |= Q(sociedad__sociedad_name__in=names)
            if cond:
                qs = qs.filter(cond)
        # Traders
        traders = policy.get('traders')
        if traders:
            ids, names = _ids_names(traders)
            cond = Q()
            if ids:
                cond |= Q(trader_id__in=ids)
            if names:
                cond |= Q(trader__trader_name__in=names)
            if cond:
                qs = qs.filter(cond)
        if isinstance(dw, dict) and (dw.get('from') or dw.get('to')):
            try:
                start = date.fromisoformat(dw['from']) if dw.get('from') else None
            except Exception:
                start = None
            try:
                end = date.fromisoformat(dw['to']) if dw.get('to') else None
            except Exception:
                end = None
            if start:
                qs = qs.filter(date__gte=start)
            if end:
                qs = qs.filter(date__lte=end)
        return qs

    if resource == 'deals':
        if centers:
            ids = _parse_ints(centers)
            if ids:
                qs = qs.filter(cost_center_id__in=ids)
        if commodities:
            ids, names = _ids_names(commodities)
            cond = Q()
            if ids:
                cond |= Q(commodity_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_name_short__in=names)
            if cond:
                qs = qs.filter(cond)
        groups = policy.get('commodity_groups')
        if groups:
            ids, names = _ids_names(groups)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_group_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_group__commodity_group_name__in=names)
            if cond:
                qs = qs.filter(cond)
        types = policy.get('commodity_types')
        if types:
            ids, names = _ids_names(types)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_type_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_type__commodity_type_name__in=names)
            if cond:
                qs = qs.filter(cond)
        subtypes = policy.get('commodity_subtypes')
        if subtypes:
            ids, names = _ids_names(subtypes)
            cond = Q()
            if ids:
                cond |= Q(commodity__commodity_subtype_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_subtype__commodity_subtype_name__in=names)
            if cond:
                qs = qs.filter(cond)
        sociedades = policy.get('sociedades')
        if sociedades:
            ids, names = _ids_names(sociedades)
            cond = Q()
            if ids:
                cond |= Q(sociedad_id__in=ids)
            if names:
                cond |= Q(sociedad__sociedad_name__in=names)
            if cond:
                qs = qs.filter(cond)
        traders = policy.get('traders')
        if traders:
            ids, names = _ids_names(traders)
            cond = Q()
            if ids:
                cond |= Q(trader_id__in=ids)
            if names:
                cond |= Q(trader__trader_name__in=names)
            if cond:
                qs = qs.filter(cond)
        if isinstance(dw, dict) and (dw.get('from') or dw.get('to')):
            try:
                start = date.fromisoformat(dw['from']) if dw.get('from') else None
            except Exception:
                start = None
            try:
                end = date.fromisoformat(dw['to']) if dw.get('to') else None
            except Exception:
                end = None
            if start:
                qs = qs.filter(date__gte=start)
            if end:
                qs = qs.filter(date__lte=end)
        return qs

    # Counterparties currently have no center/commodity/date linkage: noop
    return qs
