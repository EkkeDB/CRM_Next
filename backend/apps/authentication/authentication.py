"""
Custom JWT authentication for NextCRM that uses HttpOnly cookies.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth.models import AnonymousUser


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from HttpOnly cookies
    instead of Authorization headers.
    """
    
    def authenticate(self, request):
        # Try to get token from cookie first
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # Fallback to header-based authentication
            header_result = super().authenticate(request)
            # If header authentication also returns None, return None to allow anonymous access
            return header_result
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except (InvalidToken, TokenError):
            # If token is invalid, return None to allow anonymous access
            # This allows endpoints with @permission_classes([AllowAny]) to work
            return None

    def get_validated_token(self, raw_token):
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object.
        """
        messages = []
        for AuthToken in self.get_token_types():
            try:
                return AuthToken(raw_token)
            except TokenError as e:
                messages.append({
                    'token_class': AuthToken.__name__,
                    'token_type': AuthToken.token_type,
                    'message': e.args[0],
                })

        raise InvalidToken({
            'detail': 'Given token not valid for any token type',
            'messages': messages,
        })

    def get_token_types(self):
        """
        Returns an iterable of token types that this authentication
        backend will accept.
        """
        from rest_framework_simplejwt.settings import api_settings
        return api_settings.AUTH_TOKEN_CLASSES