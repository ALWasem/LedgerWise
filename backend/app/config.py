from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    teller_cert_path: str = "certs/certificate.pem"
    teller_key_path: str = "certs/private_key.pem"
    teller_env: str = "sandbox"
    cors_origins: list[str] = ["http://localhost:8081"]

    # Supabase
    database_url: str = ""
    supabase_url: str = ""
    supabase_key: str = ""

    # Encryption — 256-bit hex key for AES-GCM (generate with: python -c "import os; print(os.urandom(32).hex())")
    encryption_key: str = ""


settings = Settings()
