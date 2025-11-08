from rest_framework import serializers


class PolicyVisibleFieldsMixin(serializers.Serializer):
    """Filter serializer fields based on request.resolved_policy.visible_fields.

    - If visible_fields is None (unset), no filtering is applied.
    - If set, only keep fields present in that list, plus any always-allowed base fields.
    - Always-allowed base fields are minimal to avoid breaking references (e.g., 'id').
    """

    ALWAYS_FIELDS = {'id'}

    def get_fields(self):
        fields = super().get_fields()
        try:
            request = self.context.get('request') if hasattr(self, 'context') else None
            policy = getattr(request, 'resolved_policy', None) if request else None
            visible = policy.get('visible_fields') if isinstance(policy, dict) else None
        except Exception:
            visible = None

        if not visible:
            return fields

        allowed = set(self.ALWAYS_FIELDS)
        allowed.update(set(visible))
        to_remove = [name for name in fields.keys() if name not in allowed]
        for name in to_remove:
            fields.pop(name, None)
        return fields

