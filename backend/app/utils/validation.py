"""Shared input validation patterns for router-level checks."""

import re

# Transaction IDs (Teller and Plaid) are alphanumeric with underscores/hyphens
TRANSACTION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")
