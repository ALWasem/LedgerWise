"""Plaid API client configuration.

Reads PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV from settings and
exposes a configured PlaidApi instance (cached as a singleton).
"""

from functools import lru_cache

import plaid
from plaid.api import plaid_api

from app.config import settings

_ENV_TO_HOST = {
    "sandbox": plaid.Environment.Sandbox,
    "development": plaid.Environment.Development,
    "production": plaid.Environment.Production,
}


@lru_cache(maxsize=1)
def get_plaid_client() -> plaid_api.PlaidApi:
    """Return a configured Plaid API client (cached after first call)."""
    if not settings.plaid_client_id or not settings.plaid_secret:
        raise RuntimeError("PLAID_CLIENT_ID and PLAID_SECRET must be set to use Plaid")
    host = _ENV_TO_HOST.get(settings.plaid_env, plaid.Environment.Sandbox)
    configuration = plaid.Configuration(
        host=host,
        api_key={
            "clientId": settings.plaid_client_id,
            "secret": settings.plaid_secret,
        },
    )
    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)
