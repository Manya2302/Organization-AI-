# SecureVault AI — Project README
## Enterprise Intelligence Operating System | Phase 1

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- PostgreSQL 15+  
- Docker & Docker Compose (recommended)
- Ollama (for AI features): https://ollama.ai

### Option A: Docker (Recommended — Zero Config)
```bash
# Start PostgreSQL + ChromaDB
docker-compose up -d postgres chromadb

# Start backend
cd backend && npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev
```

### Option B: Manual Setup

#### 1. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm install
npm run migrate      # Create database schema
npm run seed         # Load demo data
npm run dev          # Start API server
```

#### 2. Configure Frontend
```bash
cd frontend
# .env already set to http://localhost:5000/api/v1
npm install
npm run dev
```

---

## 🤖 AI Features Setup (Local — Zero Cost)

### Install Ollama
Download from https://ollama.ai and run:
```bash
ollama serve
ollama pull qwen3:8b          # LLM for RAG responses
ollama pull nomic-embed-text  # Embedding model for vector search
```

### ChromaDB (Vector Store)
```bash
docker run -d -p 8000:8000 -v chromadb_data:/chroma/chroma chromadb/chroma
```

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Enterprise Admin | alok@acmetech.com | SecureVault@2025 |
| Department Manager | priya@acmetech.com | SecureVault@2025 |
| Employee | rohan@acmetech.com | SecureVault@2025 |

> OTP for development: Any 6-digit code sent to console log

---

## 📡 API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/send-otp` | Generate verification OTP |
| POST | `/api/v1/auth/login` | Login + get JWT |
| POST | `/api/v1/auth/register-organization` | Register new org |
| POST | `/api/v1/auth/register-employee` | Employee self-register |
| POST | `/api/v1/auth/forgot-password` | Initiate password reset |
| POST | `/api/v1/auth/reset-password` | Complete password reset |
| GET  | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Revoke session |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents` | List documents (filtered) |
| POST | `/api/v1/documents` | Upload new document |
| GET | `/api/v1/documents/:id` | Get document + OCR + versions |
| GET | `/api/v1/documents/:id/download` | Secure file download |
| POST | `/api/v1/documents/:id/version` | Upload new version |
| DELETE | `/api/v1/documents/:id` | Soft delete (trash) |
| PATCH | `/api/v1/documents/:id/restore` | Restore from trash |

### AI Copilot
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/status` | Ollama + ChromaDB health |
| POST | `/api/v1/ai/chat` | RAG chat query |
| GET | `/api/v1/ai/sessions` | Chat history |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search?q=...&type=hybrid` | Full-text + semantic search |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/overview` | Dashboard overview data |
| GET | `/api/v1/analytics/upload-trends` | Upload activity chart data |

---

## 🏗️ Architecture

```
SecureVaultAI/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind v4
│   └── src/
│       ├── lib/apiClient.ts      # ← Typed API client for backend integration
│       ├── store/useAppStore.ts  # Zustand state management
│       ├── pages/
│       │   ├── DashboardPages.tsx
│       │   ├── AuthPages.tsx
│       │   └── PublicPages.tsx
│       └── components/
│
└── backend/                      # Node.js + Express Clean Architecture
    └── src/
        ├── server.js             # Entry point
        ├── core/entities/        # Domain models (User, Document, AuditLog)
        ├── application/services/ # Business logic (AuthService)
        ├── infrastructure/
        │   ├── database/         # PostgreSQL pool + migrations + seed
        │   ├── repositories/     # Data access layer
        │   ├── ai/               # Ollama + ChromaDB + OCR services
        │   └── logging/          # Winston logger
        └── api/
            ├── middleware/       # auth, errorHandler, rateLimiter
            ├── controllers/      # Request handlers
            └── routes/           # Express route definitions
```

---

## 🔒 Security Architecture

- **JWT Authentication**: Short-lived access tokens (24h) + rotating refresh tokens (7d)
- **RBAC**: SuperAdmin → EnterpriseAdmin → DepartmentManager → Employee
- **OTP Verification**: 2-factor auth on login and registration
- **Rate Limiting**: 100 req/15min global, 10 req/15min for auth routes
- **Password Hashing**: bcrypt with 12 rounds
- **Data Sovereignty**: Zero cloud data transmission — all AI runs locally
- **Audit Trail**: Immutable PostgreSQL log for every action

---

## 📋 Phase 1 Completion Checklist

### ✅ Frontend (React 19 + Vite + Tailwind v4)
- [x] Full navigation router (11 public pages + auth + dashboard)
- [x] Midnight Premium design system (glassmorphism, dark theme)
- [x] Dashboard analytics with Recharts visualizations
- [x] Document repository with CRUD + versioning + OCR preview
- [x] Team management with RBAC controls
- [x] Security audit log viewer
- [x] AI Copilot floating chat interface
- [x] Profile & settings management
- [x] Typed API client (`src/lib/apiClient.ts`) wired to backend

### ✅ Backend (Node.js + Express Clean Architecture)
- [x] PostgreSQL schema (12 tables: orgs, users, docs, audit, AI sessions, OCR queue)
- [x] JWT auth with OTP 2FA and refresh token rotation
- [x] Full document CRUD with Multer file upload
- [x] Async OCR pipeline (PaddleOCR + smart fallback)
- [x] Ollama local LLM integration (RAG chat)
- [x] ChromaDB vector indexing + semantic search
- [x] PostgreSQL full-text search fallback
- [x] Immutable audit logging on every action
- [x] Analytics endpoints for dashboard telemetry
- [x] Rate limiting + helmet security headers
- [x] Winston structured logging
- [x] Docker Compose for full infrastructure

### ⏳ Next: Phase 2 Priorities
- [ ] Real-time notifications via WebSocket
- [ ] Email integration (OTP delivery, document share notifications)
- [ ] Compliance automation workflows (DPDP/ISO 27001 templates)
- [ ] Organizational memory graph visualization
- [ ] AI governance dashboard (model usage tracking, response quality scores)
- [ ] Vendor contract intelligence (renewal alerts, clause extraction)
- [ ] Mobile PWA packaging
