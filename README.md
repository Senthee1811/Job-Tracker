# Job Tracker: Intelligent Sri Lankan IT Job Aggregator & ATS Matcher

Job Tracker is an enterprise-grade full-stack MERN application engineered to streamline the job hunt for Sri Lankan software engineers and IT professionals. It combines automated multi-source vacancy scraping, hybrid RAG (Retrieval-Augmented Generation) resume matching powered by Google Gemini, Cloudinary CV management, automated ATS-compliant single-column PDF generation, Jake's Resume LaTeX engine with Overleaf integration, and assisted application tracking.

---

## 🏛️ System Architecture

```text
                                +------------------------------------------+
                                |         Frontend (React 19 + Vite)       |
                                |  Route Splitting / SVG Score Rings / UI  |
                                +--------------------+---------------------+
                                                     |  HTTPS (JWT Auth)
                                                     v
+----------------------------------------------------+---------------------------------------------------+
|                                       Backend (Express 5 + Node.js)                                   |
|                                                                                                       |
|  [ Scraper Orchestrator ]            [ Scoring & RAG Pipeline ]             [ CV & Application Engine]|
|  - itpro.lk                          - 50% Semantic / Cosine Vector         - Cloudinary Multi-Format |
|  - xpress.jobs                       - 30% Skill Normalized Dictionary      - pdf-parse / mammoth     |
|  - topjobs.lk                        - 10% Experience Level Heuristics      - Anti-Hallucination Guard|
|  - ikman.lk (__NEXT_DATA__)          - 10% Preference Alignment             - Jake's Resume LaTeX     |
|  - rooster.jobs                      - Circuit Breaker / Offline Fallback   - pdfkit ATS Single-Column|
|  - recruiter.lk                      - AI CV Audit & ATS Scoring            - Overleaf One-Click Edit |
+-------------------+-------------------------------+-----------------------------------+---------------+
                    |                               |                                   |
                    v                               v                                   v
          +-------------------+           +-------------------+               +-------------------+
          |  MongoDB Atlas    |           | Google Gemini API |               |  Cloudinary CDN   |
          |  Jobs, CVs, Runs, |           | gemini-3.8-flash  |               |  Secure CV Store  |
          |  Users, Bookmarks |           | text-embedding-004|               |  PDF / DOCX Raw   |
          +-------------------+           +-------------------+               +-------------------+
```

---

## ✨ Core Features

1. **Daily Sri Lankan IT Vacancy Aggregation**
   - Headless, polite HTTP/DOM parsing across 6 major Sri Lankan portals: ITPro, XpressJobs, TopJobs, Ikman, Rooster, and Recruiter.lk.
   - SHA-256 deterministic deduplication (`source`, `title`, `company`, `location`).
   - Automatic 30-day TTL cleanup to keep listings fresh and relevant.
   - Dual-mode scheduling: `node-cron` in local development (`06:00 Asia/Colombo`) and isolated HTTP triggers on Vercel Cron.

2. **Job Preferences & Targeted Vacancy Feed**
   - Post-registration onboarding modal guiding candidate role and location multi-selection.
   - Preference-driven dashboard filtering displaying top matching vacancies first with quick "Show all IT jobs" toggle.
   - Candidate preferences management in Settings tab (roles, locations, work types, experience level, custom keywords).

3. **0–100 Hybrid RAG Matching Pipeline**
   - **50% Semantic / Vector Similarity**: Cosine similarity between chunked CV embeddings and job specifications.
   - **30% Skill Overlap**: Evaluated against an alias normalization dictionary (e.g. `react.js` $\rightarrow$ `react`, `k8s` $\rightarrow$ `kubernetes`, `golang` $\rightarrow$ `go`).
   - **10% Experience Fit**: Heuristic matching of candidate experience against required seniority.
   - **10% Preference Alignment**: Role title match, remote/hybrid mode match, and location affinity.
   - **Resilient Circuit Breaker**: If Gemini API is unreachable or times out, the system degrades immediately to deterministic explanations with zero frontend latency.

4. **AI CV Audit, ATS Scoring & PDF Report Export**
   - Comprehensive resume audit evaluating ATS parsability, quantifiable impact metrics, brevity, and technical stack depth.
   - Identification of missing in-demand keywords with one-click addition to the candidate's skills checklist.
   - Actionable step-by-step section recommendations.
   - Instant download of branded, executive analysis PDF reports (`CV-Analysis-<date>.pdf`) generated via PDFKit in memory.

5. **Tailored CV: JSON → LaTeX → ATS PDF → Overleaf**
   - Model outputs structured JSON only—never raw LaTeX—preventing prompt injection or broken macros.
   - Fills Jake's Resume style single-column ATS LaTeX template with strict character escaping (`\ & % $ # _ { } ~ ^`).
   - Anti-hallucination verification automatically strips unverified employers or skills.
   - Dual preview: live PDF viewer and copyable `.tex` source.
   - One-click **"Open in Overleaf"** button opens the tailored resume directly in the Overleaf online editor.
   - Authenticated downloads for compiled PDF and `.tex` source files.

6. **Account Security & Lifecycle**
   - SHA-256 hashed single-use password reset tokens with 30-minute expiration.
   - Transactional emails delivered via Resend API (with console fallback for local dev).
   - Session invalidation across devices using incrementing `tokenVersion`.
   - Complete cascade account deletion: cleans up Cloudinary assets, CVs, tailored resumes, applications, reminders, and user records.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)
- **Cloudinary Account** (Free tier from [cloudinary.com](https://cloudinary.com))
- **Google AI Studio Key** (Free API key from [aistudio.google.com](https://aistudio.google.com/app/apikey))
- **Resend Key** (Optional, free from [resend.com](https://resend.com))

### 2. Environment Variables Configuration

In `backend/.env` (see `backend/.env.example`):
```ini
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jobtracker?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
FRONTEND_URL=http://localhost:5173
CRON_SECRET=your_secure_cron_secret

# AI & Storage
GEMINI_API_KEY=AIzaSy...your_gemini_key
GEMINI_CHAT_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

> [!IMPORTANT]
> **Cloudinary Security Setting**: If PDF delivery returns HTTP 401 ("deny or ACL failure"), the Cloudinary account setting **"PDF and ZIP files delivery"** must be enabled in your Cloudinary Console under **Settings → Security**. All candidate CVs and tailored PDFs in this application are uploaded with `resource_type: "raw"` and `type: "authenticated"`, and delivered through authenticated server endpoints with short-lived signed URLs.

# Email
EMAIL_PROVIDER_API_KEY=re_your_resend_api_key
EMAIL_FROM=Job Tracker <onboarding@resend.dev>
```

In `frontend/.env` (see `frontend/.env.example`):
```ini
VITE_API_URL=http://localhost:8000/api
```

### 3. Installation & Running

#### Start Backend:
```bash
cd backend
npm install
npm run dev
```
Backend will start on `http://localhost:8000`.

#### Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## ☁️ Deployment Guide (Vercel)

The repository is configured for seamless deployment to Vercel as two projects (or one monorepo project).

### Project A: Backend (`backend`)
1. In Vercel, click **"Add New Project"** and select the repository.
2. Set **Root Directory** to `backend`.
3. Framework Preset: **Other**.
4. Configure Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random 32+ character secret string.
   - `FRONTEND_URL`: `https://your-frontend-project.vercel.app`
   - `CRON_SECRET`: Random secret string (e.g., generated with `openssl rand -hex 32`).
   - `GEMINI_API_KEY`: Google AI Studio API key.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`
5. Click **Deploy**. Vercel will deploy `api/index.js` as a serverless function with route rewrites and schedule the 6 staggered cron jobs defined in `backend/vercel.json`.

### Project B: Frontend (`frontend`)
1. Click **"Add New Project"** and select the same repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   - `VITE_API_URL`: `https://your-backend-project.vercel.app/api`
5. Click **Deploy**. Vercel will build with `npm run build` and serve `dist/` with SPA routing rules configured in `frontend/vercel.json`.

---

## 🛠️ Testing & Verification

### Run Backend Unit & Integration Tests:
```bash
cd backend
npm test
```
The test suite validates:
- Multi-format CV text extraction (PDF & DOCX).
- ATS single-column PDF formatting.
- Skill normalization & 50/30/10/10 hybrid scoring formulas.
- Anti-hallucination validation filters.
- Real DOM and JSON fixture parsers for all 6 Sri Lankan job board scrapers.
- SHA-256 password reset token generation, single-use invalidation, and `tokenVersion` session revocation.
- AI CV analysis heuristic engine and branded PDF report buffer creation.
- Single-pass LaTeX escaping (`\ & % $ # _ { } ~ ^`) and Jake's Resume `.tex` rendering.

### Build Frontend Production Bundle:
```bash
cd frontend
npm run build
```
Confirms route-level code splitting, asset optimizations, and compiles distribution assets to `frontend/dist/`.

---

## 📄 License
ISC License. Built for Sri Lankan developers.
