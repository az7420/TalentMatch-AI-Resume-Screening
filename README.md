# TalentMatch AI 🧠

**AI-powered Resume Screening & Candidate Ranking Platform for modern recruiters.**

Upload resumes and a job description. TalentMatch AI automatically analyzes, scores (0-100), and ranks candidates — giving you detailed insights, skill gap analysis, and hiring recommendations.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Auth** | Secure recruiter login/register |
| 📤 **Bulk Upload** | Drag-and-drop up to 50 resumes (PDF/DOC/DOCX) |
| 🤖 **AI Scoring** | Sentence-transformers + rule-based scoring |
| 📊 **Analytics** | Score distributions, skill gaps, hiring funnel |
| 🏆 **Rankings** | Automatic candidate ranking with hire/reject recommendations |
| 📥 **Export** | CSV and Excel export with formatting |
| 🌙 **Dark Mode** | Full dark/light theme support |
| 📱 **Responsive** | Mobile-friendly design |

---

## 📁 Project Structure

```
talentmatch-ai/
├── frontend/                    # Next.js 15 + React 19 + TypeScript
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Register page
│   │   │   └── dashboard/       # Protected dashboard
│   │   │       ├── page.tsx     # Dashboard home
│   │   │       ├── upload/      # JD + resume upload wizard
│   │   │       ├── candidates/  # Candidate list + detail
│   │   │       ├── analytics/   # Analytics dashboard
│   │   │       └── compare/     # Side-by-side comparison
│   │   ├── components/          # Reusable React components
│   │   ├── lib/                 # API client, utilities
│   │   ├── store/               # Zustand state management
│   │   └── types/               # TypeScript definitions
│   ├── tailwind.config.ts
│   └── package.json
│
└── backend/                     # FastAPI + SQLAlchemy
    ├── app/
    │   ├── main.py              # FastAPI app entry
    │   ├── config.py            # Settings (Pydantic)
    │   ├── database.py          # SQLAlchemy setup
    │   ├── models/              # ORM models
    │   ├── schemas/             # Pydantic schemas
    │   ├── routers/             # API route handlers
    │   │   ├── auth.py          # POST /auth/register, /login
    │   │   ├── jd.py            # POST/GET /jd
    │   │   ├── resumes.py       # POST /resumes/upload
    │   │   ├── analysis.py      # POST /analyze/{jd_id}
    │   │   ├── analytics.py     # GET /analytics/{jd_id}
    │   │   └── export.py        # GET /export/csv, /excel
    │   ├── services/            # Business logic
    │   │   ├── resume_parser.py # PyMuPDF + spaCy resume parsing
    │   │   ├── jd_parser.py     # JD text/file parsing
    │   │   ├── ai_scorer.py     # AI scoring engine
    │   │   └── export_service.py # CSV/Excel generation
    │   └── utils/
    │       ├── security.py      # JWT + password hashing
    │       └── file_handler.py  # File upload management
    ├── scripts/
    │   └── seed.py              # Database seed data
    ├── uploads/                 # Local file storage
    ├── requirements.txt
    └── Dockerfile
```

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+ (local) or Neon (cloud)
- **Docker** (optional, for containerized setup)

---

### 🐍 Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download spaCy NLP model
python -m spacy download en_core_web_sm

# 5. Copy and configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY

# 6. Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### ⚛️ Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:8000

# 4. Start development server
npm run dev
```

Frontend will be at `http://localhost:3000`

---

### 🐳 Docker Setup (Full Stack)

```bash
# From project root:

# 1. Copy backend .env
cp backend/.env.example backend/.env

# 2. Start all services
docker-compose up --build

# Services:
# - Frontend:  http://localhost:3000
# - Backend:   http://localhost:8000
# - Postgres:  localhost:5432
```

---

### 🌱 Seed Database

```bash
cd backend
python scripts/seed.py

# Creates:
# - Demo user: demo@talentmatch.ai / demo123456
# - 1 sample JD (Senior Full Stack Engineer)
# - 4 sample candidates with AI analysis results
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/talentmatch` |
| `SECRET_KEY` | JWT signing key (change in prod!) | `change-me-...` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` (24h) |
| `UPLOAD_DIR` | Local file storage path | `uploads` |
| `MAX_FILE_SIZE_MB` | Max resume size | `10` |
| `EMBEDDING_MODEL` | Sentence Transformer model | `all-MiniLM-L6-v2` |
| `USE_OPENAI_EMBEDDINGS` | Use OpenAI instead of local | `false` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `USE_S3_STORAGE` | Use AWS S3 for files | `false` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

---

## 🤖 AI Scoring Algorithm

The scoring engine combines **semantic similarity** with **rule-based matching**:

```
Final Score (0-100) =
  Embedding Similarity    × 50  (semantic meaning match)
  + Skill Match           × 20  (required skills coverage)
  + Experience Match      × 15  (years of experience)
  + Education Match       × 10  (degree level)
  + Project Relevance     × 5   (portfolio relevance)
```

### Score Breakdown Display (out of 100)
| Component | Weight | Max Points |
|-----------|--------|------------|
| Skills Match | 40% | 40 |
| Experience Match | 25% | 25 |
| Education Match | 15% | 15 |
| Keyword Similarity | 10% | 10 |
| Project Relevance | 10% | 10 |

### Hiring Recommendations
| Score | Recommendation |
|-------|---------------|
| ≥ 85 | 🟢 Highly Recommended |
| 70–84 | 🔵 Recommended |
| 50–69 | 🟡 Consider |
| < 50 | 🔴 Not Recommended |

### Semantic Embedding
- Uses **sentence-transformers/all-MiniLM-L6-v2** (384-dimensional vectors)
- Converts resume text and JD to dense vectors
- Computes **cosine similarity** for semantic understanding
- Falls back to **TF-IDF similarity** if model unavailable

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new recruiter |
| `POST` | `/api/v1/auth/login` | Login, get JWT |
| `GET` | `/api/v1/auth/me` | Current user profile |
| `POST` | `/api/v1/jd/` | Create JD from text |
| `POST` | `/api/v1/jd/upload` | Create JD from file |
| `GET` | `/api/v1/jd/` | List all JDs |
| `GET` | `/api/v1/jd/{id}` | Get specific JD |
| `POST` | `/api/v1/resumes/upload` | Upload resumes (multipart) |
| `GET` | `/api/v1/resumes/{jd_id}/list` | List resumes for JD |
| `GET` | `/api/v1/resumes/download/{id}` | Download resume file |
| `POST` | `/api/v1/analyze/{jd_id}` | Run AI analysis |
| `GET` | `/api/v1/analyze/candidates/{jd_id}` | Get ranked candidates |
| `GET` | `/api/v1/analyze/candidate/{id}` | Get candidate detail |
| `GET` | `/api/v1/analytics/{jd_id}` | Get analytics data |
| `GET` | `/api/v1/export/csv/{jd_id}` | Export CSV |
| `GET` | `/api/v1/export/excel/{jd_id}` | Export Excel |
| `GET` | `/health` | Health check |

---

## 🗄️ Database Schema

```sql
users              -- Recruiters with JWT auth
job_descriptions   -- JDs with parsed requirements + embeddings
candidates         -- Resume data + extracted info + embeddings
candidate_skills   -- Individual skills (many-to-one candidate)
analysis_results   -- AI scores, rank, recommendation, insights
```

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Or connect GitHub repo to Vercel
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Create new Web Service on Render
2. Connect your GitHub repo
3. Set Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env.example`

### Database → Neon PostgreSQL

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string (with `?sslmode=require`)
4. Set as `DATABASE_URL` in Render environment

---

## 🧪 Testing

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# Check API health
curl http://localhost:8000/health
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TalentMatch AI                       │
├──────────────────┬──────────────────────────────────────┤
│   FRONTEND       │              BACKEND                 │
│   Next.js 15     │           FastAPI (Python)           │
│   React 19       │                                      │
│   TypeScript     │  ┌─────────────────────────────┐    │
│   Tailwind CSS   │  │    AI Scoring Engine         │    │
│   Framer Motion  │  │  • sentence-transformers     │    │
│   Recharts       │  │  • spaCy NLP                 │    │
│   Zustand        │  │  • PyMuPDF / python-docx     │    │
│                  │  │  • TF-IDF fallback           │    │
│                  │  └─────────────────────────────┘    │
│                  │                                      │
│                  │  ┌─────────────────────────────┐    │
│                  │  │     SQLAlchemy ORM           │    │
│                  │  └─────────────┬───────────────┘    │
├──────────────────┴────────────────┼────────────────────┤
│                          PostgreSQL Database            │
│                     (Neon / local Docker)              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Security

- **Password hashing**: bcrypt via passlib
- **JWT authentication**: python-jose with HS256
- **File validation**: extension + content-type checks, size limits
- **SQL injection**: prevented by SQLAlchemy ORM parameterization
- **CORS**: configurable allowed origins
- **Input sanitization**: filename sanitization, regex validation
- **Non-root Docker**: app runs as non-root user in containers

---

## 📝 Assumptions

1. **Embedding model**: Uses `all-MiniLM-L6-v2` by default. First startup downloads ~90MB model.
2. **Resume parsing accuracy**: NLP extraction is heuristic-based; complex PDF layouts may reduce accuracy.
3. **File storage**: Local filesystem by default; AWS S3 integration is stubbed and ready to activate.
4. **spaCy model**: `en_core_web_sm` must be downloaded manually (included in Dockerfile).
5. **Rate limiting**: API rate limiting is implemented via slowapi; adjust limits in `config.py`.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by TalentMatch AI**
