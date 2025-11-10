from __future__ import annotations
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

from django.contrib.auth.models import User
from .models import UserRoleAssignment


def _normalize_date_window(dw: Dict[str, Any]) -> Tuple[Optional[date], Optional[date]]:
    if not isinstance(dw, dict):
        return (None, None)
    start = None
    end = None
    if dw.get('from'):
        try:
            start = date.fromisoformat(str(dw['from']))
        except Exception:
            start = None
    if dw.get('to'):
        try:
            end = date.fromisoformat(str(dw['to']))
        except Exception:
            end = None
    if start is None and end is None and dw.get('months_back'):
        try:
            months = int(dw['months_back'])
            end = date.today()
            start = end - timedelta(days=30*months)
        except Exception:
            pass
    return (start, end)


def resolve_policy(user: User) -> Dict[str, Any]:
    """
    Merge all active role assignments for a user into a resolved policy.
    Rules:
      - permissions: union
      - centers/commodities: intersection across assignments that specify them; unrestricted if none specify
      - date_window: intersection (max of starts, min of ends)
      - max_export_rows: minimum non-null value
      - visible_fields: intersection across assignments that specify them; unrestricted if none specify
    """
    assignments = UserRoleAssignment.objects.select_related('role').filter(user=user, is_active=True, role__is_active=True)

    permissions: Set[str] = set()
    centers: Optional[Set[int]] = None
    centers_unrestricted = True
    commodities: Optional[Set[str]] = None
    commodities_unrestricted = True
    start_acc: Optional[date] = None
    end_acc: Optional[date] = None
    max_export: Optional[int] = None
    visible_fields: Optional[Set[str]] = None

    for a in assignments:
        # permissions
        perms = a.role.permissions or []
        permissions.update([str(p) for p in perms])

        c = a.constraints or {}
        # centers
        if isinstance(c.get('centers'), list) and c['centers']:
            s = set()
            for v in c['centers']:
                try:
                    s.add(int(v))
                except Exception:
                    continue
            if s:
                if centers_unrestricted and centers is None:
                    centers = s
                    centers_unrestricted = False
                else:
                    centers = (centers & s) if centers is not None else s

        # commodities
        if isinstance(c.get('commodities'), list) and c['commodities']:
            s2 = set([str(v) for v in c['commodities'] if v])
            if s2:
                if commodities_unrestricted and commodities is None:
                    commodities = s2
                    commodities_unrestricted = False
                else:
                    commodities = (commodities & s2) if commodities is not None else s2

        # date window
        dw = c.get('date_window')
        ds, de = _normalize_date_window(dw) if dw else (None, None)
        if ds:
            start_acc = ds if start_acc is None else max(start_acc, ds)
        if de:
            end_acc = de if end_acc is None else min(end_acc, de)

        # max export rows
        if c.get('max_export_rows') is not None:
            try:
                val = int(c['max_export_rows'])
                max_export = val if (max_export is None or val < max_export) else max_export
            except Exception:
                pass

        # visible fields
        vf = c.get('visible_fields')
        if isinstance(vf, list) and vf:
            s3 = set([str(v) for v in vf if v])
            visible_fields = s3 if visible_fields is None else (visible_fields & s3)

        # ui pages (per-user visibility tokens)
        ui_pages = c.get('ui_pages')
        if isinstance(ui_pages, list) and ui_pages:
            for p in ui_pages:
                try:
                    permissions.add(f"ui:{str(p)}")
                except Exception:
                    continue

    resolved = {
        'permissions': sorted(permissions),
        'centers': None if centers_unrestricted else sorted(centers or []),
        'commodities': None if commodities_unrestricted else sorted(commodities or []),
        'date_window': None if (start_acc is None and end_acc is None) else {
            **({'from': start_acc.isoformat()} if start_acc else {}),
            **({'to': end_acc.isoformat()} if end_acc else {}),
        },
        'max_export_rows': max_export,
        'visible_fields': sorted(list(visible_fields)) if visible_fields is not None else None,
    }
    return resolved


def check_allowed(policy: Dict[str, Any], resource: str, action: str) -> Tuple[bool, str]:
    token = f"{resource}:{action}"
    if token in set(policy.get('permissions', [])):
        return True, f"allowed via permission {token}"
    return False, f"missing permission {token}"
