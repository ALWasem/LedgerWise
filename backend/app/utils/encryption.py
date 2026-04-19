"""AES-GCM encryption for sensitive data at rest.

Uses Fernet-style envelope: 12-byte nonce || ciphertext || 16-byte tag,
base64-encoded for safe storage in text columns.
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


def _get_key() -> bytes:
    """Decode the 256-bit AES key from the hex-encoded env var."""
    raw = settings.encryption_key
    if not raw:
        raise RuntimeError("ENCRYPTION_KEY env var is not set — cannot encrypt tokens")
    key = bytes.fromhex(raw)
    if len(key) != 32:
        raise RuntimeError("ENCRYPTION_KEY must be exactly 64 hex chars (256 bits)")
    return key


def encrypt(plaintext: str) -> str:
    """Encrypt a string and return a base64-encoded ciphertext."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # nonce + ciphertext (includes 16-byte auth tag appended by AES-GCM)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt(token: str) -> str:
    """Decrypt a base64-encoded ciphertext back to the original string."""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(token)
    nonce = raw[:12]
    ciphertext = raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")
