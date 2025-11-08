# Voice Biometrics & Liveness Verification Monorepo

Cross-platform mobile app + admin dashboard implementing voice biometrics (enrollment/verification), facial liveness, document upload placeholders, secure auth, and CI/CD.

Packages:

- mobile-app: React Native (Expo) client (TypeScript)
- dashboard: Admin web dashboard (React/Next.js-ready) (TypeScript)
- api: Node.js + Express API (TypeScript)
- ml-service: Python FastAPI microservice (placeholders for ML)
- infra: Docker, docker-compose, deploy templates

## Architecture

```
	┌───────────────────────────────┐           ┌──────────────────────────┐
	│           mobile-app          │           │        dashboard         │
	│  (React Native + Expo + TS)   │           │    (React/Next.js + TS) │
	└──────────────┬────────────────┘           └──────────────┬───────────┘
		       │                                         │
		       │ HTTPS                                   │ HTTPS
		       ▼                                         ▼
	      ┌─────────────────────┐                 ┌─────────────────────┐
	      │         api         │  <────────────▶ │    MongoDB Atlas    │
	      │ (Express + TS + JWT)│                 └─────────────────────┘
	      └──────────┬──────────┘
			 │
			 │ HTTP (internal)
			 ▼
	      ┌─────────────────────┐        S3 (presigned URLs)
	      │      ml-service     │ ─────────────────────────────▶ media bucket
	      │  (FastAPI, stubs)   │
	      └─────────────────────┘
```

## Quick start

1) Install Node 20+ and Python 3.10+.

2) Install JS deps at root:

```
npm install
```

3) Start services (placeholders for now):

```
# API (TS dev)
npm --workspace api run dev

# ML service (Python)
# In another shell
pip install -r ml-service/requirements.txt
python -m uvicorn app.main:app --reload --app-dir ml-service
```

## Environment variables

Copy and set these in the respective services (see Step 2/Step 4 for details):

```
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
S3_BUCKET=
S3_REGION=
S3_KEY=
S3_SECRET=
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
PORT=4000
DEFAULT_LANGUAGE=en
```

## Internationalization (i18n)

- Supported languages: English (en), French (fr), Somali (so), Amharic (am), Oromo (om).
- Mobile and dashboard use i18next-based scaffolding.
- Add translations by extending the JSON files under each project’s i18n folder.

## Deploy checklist

- Configure MongoDB Atlas and store MONGO_URI securely.
- Provision S3 bucket and set presigned URL policy.
- Set secrets in CI/CD (JWT secrets, S3 creds, ML_SERVICE_URL).
- Build and push Docker images for api and ml-service.
- Apply infra manifests or compose stack to staging/prod.

See DELIVERABLES.md for step-by-step progress. Step 1 scaffolds the repo and CI. Step 2 (this README) adds high-level docs.
