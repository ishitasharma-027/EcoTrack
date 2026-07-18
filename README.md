# EcoTrack – AI-Powered Smart Waste Management Platform

Full-stack web application for illegal waste detection, smart segregation, and e-waste recycling with AI models, JWT auth, and MongoDB.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Leaflet |
| Backend | FastAPI, Pydantic, SQLAlchemy-style patterns, JWT |
| Database | MongoDB |
| AI | YOLO (`best.pt`) + ResNet18 (`best_model_epoch_12.pth`) |

## Project Structure

```
EcoTrack/
├── frontend/          # Next.js app
├── backend/           # FastAPI API
├── AI/
│   ├── illegal_waste/best.pt
│   └── segregation/best_model_epoch_12.pth
├── uploads/           # Uploaded images
└── database/
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally (or update `MONGODB_URL`)

## Quick Start

### 1. MongoDB

Start MongoDB on `mongodb://localhost:27017`

### 2. Backend

```bash
cd EcoTrack/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd EcoTrack/frontend
npm install
npm run dev
```

App: http://localhost:3000

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecotrack.com | Admin@123 |
| Citizen | demo@ecotrack.com | Demo@123 |

## AI Models

- **Illegal waste detection**: YOLO model at `AI/illegal_waste/best.pt`
- **Waste segregation**: ResNet18 classifier at `AI/segregation/best_model_epoch_12.pth` (6 classes), with YOLO fallback

## Key Features

- Landing page with hero, stats, features
- JWT authentication (Citizen + Admin roles)
- Illegal waste reporting with AI detection + Leaflet map
- Smart waste segregation with disposal guides
- E-waste submission to collection centers
- Eco Wallet with reward redemption
- Admin analytics dashboard with charts
- Complaint management, user management, CSV export
- Notifications system

## Environment Variables

**Backend** (`backend/.env`):
- `MONGODB_URL`, `JWT_SECRET`, `CORS_ORIGINS`, model paths

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register citizen |
| POST | `/api/auth/login` | Login |
| POST | `/api/detect-illegal-waste` | YOLO detection |
| POST | `/api/segregation` | Waste classification |
| POST | `/api/complaints` | Submit complaint |
| GET | `/api/dashboard/stats` | User dashboard data |
| GET | `/api/admin/analytics` | Admin analytics |

See Swagger UI at `/docs` for full API documentation.
