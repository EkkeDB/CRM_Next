from __future__ import annotations
from typing import Any, Dict, Optional, Sequence
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
            ids = _parse_ints(commodities)
            names = _parse_strs(commodities)
            cond = Q()
            if ids:
                cond |= Q(commodity_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_name_short__in=names)
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
            ids = _parse_ints(commodities)
            names = _parse_strs(commodities)
            cond = Q()
            if ids:
                cond |= Q(commodity_id__in=ids)
            if names:
                cond |= Q(commodity__commodity_name_short__in=names)
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

