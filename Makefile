.PHONY: backend frontend install migrate grant-pro revoke-pro

LAN_IP := $(shell ipconfig getifaddr en0)

# Start the FastAPI backend (creates venv and installs deps if needed)
backend:
	cd backend && \
	( [ -d venv ] || python3 -m venv venv ) && \
	. venv/bin/activate && \
	pip install -q -r requirements.txt && \
	CORS_ORIGINS='["http://localhost:8081","http://$(LAN_IP):8081"]' \
	uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Start the Expo frontend (auto-detects LAN IP for web + mobile)
frontend:
	cd frontend && EXPO_PUBLIC_API_URL=http://$(LAN_IP):8000 npx expo start --clear

# Run Alembic migrations
migrate:
	cd backend && . venv/bin/activate && alembic upgrade head

# Grant pro status: make grant-pro EMAIL=user@example.com
grant-pro:
	cd backend && . venv/bin/activate && python grant_pro.py $(EMAIL)

# Revoke pro status: make revoke-pro EMAIL=user@example.com
revoke-pro:
	cd backend && . venv/bin/activate && python revoke_pro.py $(EMAIL)

# Install all dependencies (backend venv + frontend node_modules)
install:
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install
