# SecureVault AI — Enterprise Intelligence & Control Platform

SecureVault AI is a full-stack enterprise platform for secure document operations, AI-assisted intelligence, compliance automation, audit readiness, and digital twin strategy simulation.

This repository contains:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind
- **Backend**: Node.js + Express + PostgreSQL + Clean Architecture
- **AI stack**: Ollama (LLM + embeddings), ChromaDB (vector search), OCR pipeline
- **Deployment support**: Docker Compose for local/self-hosted infrastructure

---

## 1) What this platform is used for

SecureVault AI is designed for organizations that need to:
- Centralize business documents with controlled access and audit trails
- Run OCR, semantic search, and AI chat over organizational knowledge
- Track compliance controls, evidence, readiness, and audits
- Govern enterprise AI usage (model registry, prompt governance, trust/risk)
- Run autonomous operations workflows, recommendations, and command-center views
- Model business dependencies and strategic scenarios via a digital twin layer
- Configure commercial scale capabilities (integrations, marketplace, billing, white-label)

---

## 2) Repository structure

```text
<repository-root>/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── api/                # routes, controllers, middleware
│       ├── application/        # domain services (compliance, governance, twin, etc.)
│       ├── core/               # entities
│       └── infrastructure/     # database, repositories, AI, jobs, logging, email
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── lib/apiClient.ts
        ├── pages/              # public, auth, dashboard module pages
        ├── components/
        ├── design-system/
        └── store/useAppStore.ts
```

---

## 3) Core modules in backend

Main API boot file: `backend/src/server.js`

### Platform API domains
Mounted under `/api/v1/*`:
- `auth` (OTP/JWT auth, registration, password flows, Google login endpoint)
- `documents` (upload, versioning, download, soft delete/restore)
- `employees`, `organizations`, `audit`
- `ai`, `ocr`, `search`, `analytics`
- `intelligence`, `knowledge`, `graph`, `memory`
- `compliance`, `audit/copilot`, `ai/governance`
- `operations` (AEOP)
- `digital twin` routes
- `commercial` (connectors, subscription, marketplace, infra/security operations)

### Service architecture highlights
`backend/src/application/services/` includes enterprise modules such as:
- AI governance services (models, prompt security, approvals, trust, risk)
- Compliance services (controls, evidence, mappings, reporting, workflows)
- Audit copilot services (planning, findings, readiness, remediation, packaging)
- EIOS/knowledge graph services (memory freshness/ownership/risk, experts, timelines)
- AEOP services (workflows, actions, recommendations, outcomes, command center)
- Digital twin + strategy services (simulation, forecasting, resilience, war-room)
- Commercial ecosystem services (integrations, subscriptions, white-label, plugins, infra)

---

## 4) Frontend experience

Entry and routing:
- `frontend/src/App.tsx` handles public/auth/dashboard routing
- `frontend/src/pages/DashboardPages.tsx` organizes the major product workspaces

Dashboard includes client-facing workspaces for:
- Documents & analytics
- Knowledge center and graph exploration
- Compliance and audit copilot
- AI governance and explainability
- Enterprise intelligence OS
- Autonomous operations
- Cognitive digital twin strategy
- Commercial/integration ecosystem

API integration in frontend:
- `frontend/src/lib/apiClient.ts` provides typed wrappers for key backend domains

---

## 5) Document pipeline (how documents are used)

The document lifecycle is implemented across document routes/controllers, worker jobs, repositories, OCR services, and AI services.

### End-to-end flow
1. **Upload** via `/api/v1/documents` (Multer-based file handling)
2. **Store metadata** in PostgreSQL (`documents`, `document_versions`)
3. **Queue processing** through OCR/AI queue (`ocr_queue`, worker services)
4. **OCR extraction** via `OCRService` (Paddle OCR API with fallback logic)
5. **Indexing** into vector layer (Chroma service) + DB metadata update
6. **Discovery** via hybrid search (`/api/v1/search`) and related AI/intelligence APIs
7. **Usage in AI chat** through `/api/v1/ai/chat` and intelligence features
8. **Governance visibility** through audit/compliance/readiness modules

Supported upload types are defined in `backend/.env.example`.

---

## 6) Integrations with other apps/services

### Infrastructure integrations
- **PostgreSQL** (primary relational store)
- **ChromaDB** (vector DB)
- **Ollama** (local LLM + embeddings)
- **Redis (optional)** for queue support/fallback queue mode
- **SMTP (optional)** via Nodemailer (`EmailService`) for OTP/email workflows
- **Neo4j hooks present** in service layer for graph-health/sync-related capabilities

### Commercial connector ecosystem
Commercial services and migrations define connector support for platforms such as:
- SharePoint
- OneDrive
- Google Drive
- Jira
- ServiceNow
- SAP
- Salesforce
- Slack
- Teams
- GitHub

These are managed through `/api/v1/commercial/connectors*` endpoints and related service logic.

---

## 7) Security model

Implemented via middleware/services in backend:
- Helmet security headers
- CORS with controlled origin
- JWT auth + refresh token handling
- OTP verification workflows
- Role-based access control (SuperAdmin, EnterpriseAdmin, DepartmentManager, Employee)
- API rate limiting (global + auth-specific)
- Audit logging for critical actions

---

## 8) Database phases and schema expansion

Migration orchestration is in `backend/src/infrastructure/database/migrate.js`.

Current migration progression in code:
- Phase 1: Core auth/document/audit/AI tables
- Phase 6: AI governance schema
- Phase 7: Enterprise intelligence OS schema
- Phase 8: AEOP schema
- Phase 9: Digital twin and strategy schema
- Phase 10: Commercialization and global scale schema

This phased design reflects growth from document platform → intelligence/governance → operations/twin → enterprise scale.

---

## 9) Local setup

## Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker + Docker Compose
- Ollama (for local AI features)

### Option A: Docker-backed services + local apps
```bash
cd <repository-root>
docker-compose up -d postgres chromadb

# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

### Option B: Full manual
```bash
cd <repository-root>/backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

cd ../frontend
npm install
npm run dev
```

### Ollama setup
```bash
ollama serve
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

---

## 10) Build/lint commands available

Frontend (`frontend/package.json`):
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

Backend (`backend/package.json`):
- `npm run dev`
- `npm run start`
- `npm run migrate`
- `npm run seed`

---

## 11) Deployment notes

- `docker-compose.yml` includes services for `postgres`, `chromadb`, and `backend`
- Backend container healthcheck targets `/health`
- Backend Docker image runs as a non-root user
- Uploads/logs are persisted through mounted volumes

---

## 12) Client handover summary

This repository is already structured as a modular enterprise platform and can be presented to clients as:
1. **A secure document intelligence base layer**
2. **An AI-governed compliance and audit operating system**
3. **An operations + strategy command platform (AEOP + Digital Twin)**
4. **A commercialization-ready ecosystem with integration and scaling controls**

For client demos, prioritize flows in this order:
- Auth + role login
- Document upload → OCR → search → AI response
- Compliance/Audit readiness dashboards
- AI governance and trust/risk controls
- Commercial connector and subscription views
