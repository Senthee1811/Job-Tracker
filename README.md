# Job Tracker: Intelligent Sri Lankan IT Job Aggregator & ATS Matcher

Job Tracker is an enterprise-grade full-stack MERN application engineered to streamline the job hunt for Sri Lankan software engineers and IT professionals. It combines automated multi-source vacancy scraping, hybrid RAG (Retrieval-Augmented Generation) resume matching powered by Google Gemini, Cloudinary CV management, automated ATS-compliant single-column PDF generation, and assisted application tracking.

---

## 🏛️ System Architecture

```text
                               +------------------------------------------+
                               |         Frontend (React 19 + Vite)       |
                               |  Route Splitting / SVG Score Rings / UI  |
                               +--------------------+---------------------+
                                                    |  HTTPS (JWT Auth)
                                                    v
+---------------------------------------------------+---------------------------------------------------+
|                                       Backend (Express 5 + Node.js)                                   |
|                                                                                                       |
|  [ Scraper Orchestrator ]            [ Scoring & RAG Pipeline ]             [ CV & Application Engine]|
|  - itpro.lk                          - 50% Semantic / Cosine Vector         - Cloudinary Multi-Format |
|  - xpress.jobs                       - 30% Skill Normalized Dictionary      - pdf-parse / mammoth     |
|  - topjobs.lk                        - 10% Experience Level Heuristics      - Anti-Hallucination Guard|
|  - ikman.lk (__NEXT_DATA__)          - 10% Preference Alignment             - pdfkit ATS Single-Column|
|  - rooster.jobs                      - Circuit Breaker / Offline Fallback   - Assisted Apply Workflow |
|  - recruiter.lk                                                                                       |
+-------------------+-------------------------------+-----------------------------------+---------------+
                    |                               |                                   |
                    v                               v                                   v
          +-------------------+           +-------------------+               +-------------------+
          |  MongoDB Atlas    |           | Google Gemini API |               |  Cloudinary CDN   |
          |  Jobs, CVs, Runs, |           | gemini-1.5-flash  |               |  Secure CV Store  |
          |  Users, Bookmarks |           | text-embedding-004|               |  PDF / DOCX Raw   |
          +-------------------+           +-------------------+               +-------------------+
```

---

## ✨ Core Features

1. **Daily Sri Lankan IT Vacancy Aggregation**
   - Headless, polite HTTP/DOM parsing across 6 major Sri Lankan portals: ITPro, XpressJobs, TopJobs, Ikman, Rooster, and Recruiter.lk.
   - SHA-256 deterministic deduplication (`source`, `title`, `company`, `location`).
   - Automatic 30-day TTL cleanup to keep listings fresh and relevant.
   - Daily automated scheduler (`node-cron`) running at `06:00 Asia/Colombo`.

2. **0–100 Hybrid RAG Matching Pipeline**
   - **50% Semantic / Vector Similarity**: Cosine similarity between candidate CV sections and job specifications.
   - **30% Skill Overlap**: Evaluated against an alias normalization dictionary (e.g. `react.js` $\rightarrow$ `react`, `k8s` $\rightarrow$ `kubernetes`, `golang` $\rightarrow$ `go`).
   - **10% Experience Fit**: Heuristic matching of candidate experience against required seniority.
   - **10% Preference Alignment**: Role title match, remote/hybrid mode match, and location affinity.
   - **Resilient Circuit Breaker**: If Gemini API is unreachable or times out, the system degrades immediately to deterministic explanations with zero frontend latency.

3. **Cloudinary CV Engine & Multi-Format Parsing**
   - Secure cloud storage replacing disk storage.
   - Supports both PDF (`pdf-parse`) and DOCX (`mammoth`) uploads.
   - CV versioning: preserves history and allows switching between active CV versions.

4. **Per-Job Tailored CV & ATS PDF Generation**
   - Uses Gemini AI to rephrase, highlight, and align achievements strictly matching the targeted job.
   - **Zero Hallucination Guarantee**: Programmatic post-validation strips any skills or employers not present in the candidate's original resume.
   - Instant ATS single-column PDF export generated on-the-fly using `pdfkit`.

5. **Assisted Application Workflow**
   - "Apply" opens the official portal in a background tab, logs the application in the tracker, links the tailored CV PDF, and copies a customized cover note or opens `mailto:`.

6. **Modern Frontend Experience**
   - React 19 + Tailwind CSS v4.
   - Route-level code splitting with `React.lazy()` and `Suspense` skeletons (entry bundle reduced by >80 kB).
   - Dynamic SVG Score Rings (green $\ge 75$, amber $\ge 50$, red $< 50$).
   - Quick filters for Sri Lankan IT hubs (Colombo, Kandy, Remote) and work modes.

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)
- **Cloudinary Account** (Free tier from [cloudinary.com](https://cloudinary.com))
- **Google AI Studio Key** (Free API key from [aistudio.google.com](https://aistudio.google.com/app/apikey))

### 2. Environment Variables Configuration

In `backend/.env`, configure the following variables (refer to `backend/.env.example`):

```ini
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_from_google_ai_studio
GEMINI_CHAT_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note on Fallbacks**: If Cloudinary or Gemini credentials are missing or temporarily unreachable, the backend gracefully falls back to deterministic parsing and mock storage links to maintain full application functionality without crashing.

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
- Cosine similarity & chunking algorithms.
- Anti-hallucination validation filters.
- Real DOM and JSON fixture parsers for all 6 Sri Lankan job board scrapers.

### Build Frontend Production Bundle:
```bash
cd frontend
npm run build
```
Confirms route-level code splitting and compiles distribution assets to `frontend/dist/`.

---

## 🔌 Developer Guide: Adding a New Scraper Adapter

Adding a new Sri Lankan job board adapter is straightforward. Follow these steps:

1. **Create Adapter File**:
   Add a new file in `backend/services/scrapers/<source_name>.js`.

2. **Implement the Contract**:
   Every adapter must export a `scrape()` function returning an array of standardized job objects:

   ```javascript
   import * as cheerio from "cheerio";
   import { politeFetch, computeDedupeHash, isLikelyItJob } from "./shared.js";

   export const scrape = async () => {
       const jobs = [];
       const html = await politeFetch("https://example.lk/careers/it");
       const $ = cheerio.load(html);

       $(".job-card").each((_, el) => {
           const title = $(el).find(".title").text().trim();
           const company = $(el).find(".company").text().trim();
           const location = $(el).find(".location").text().trim() || "Sri Lanka";
           const applyUrl = $(el).find("a").attr("href");

           // Filter strictly for IT/Software roles
           if (!isLikelyItJob(title, "")) return;

           jobs.push({
               title,
               company,
               location,
               mode: "hybrid",
               source: "example",
               sourceId: computeDedupeHash({ title, company, location, source: "example" }),
               applyUrl,
               skills: ["Software Engineering"],
               postedAt: new Date()
           });
       });

       return jobs;
   };
   ```

3. **Register in Orchestrator**:
   Import your adapter in `backend/services/scrapers/index.js` and add it to `ACTIVE_SCRAPERS`.

4. **Verify Live Health**:
   Trigger an on-demand scrape and check source health:
   - `POST /api/jobs/refresh`
   - `GET /api/jobs/sources/health`

---

## 📊 Hybrid Scoring Weights & Skill Dictionary

Job recommendations are ranked using the formula in `backend/services/scoringConfig.js`:

| Dimension | Weight | Details |
| :--- | :--- | :--- |
| **Semantic Similarity** | 50% | Cosine similarity between chunked CV embeddings and job requirements |
| **Skill Overlap** | 30% | Overlap calculated against canonical skills using alias mapping (`k8s` $\rightarrow$ `kubernetes`, `py` $\rightarrow$ `python`, `node` $\rightarrow$ `node.js`) |
| **Experience Fit** | 10% | Heuristic matching candidate's verified years against role seniority |
| **Preference Alignment** | 10% | Alignment with candidate's target title, work mode (remote/hybrid), and location |

---

## 🛡️ Anti-Hallucination & Security Guarantees

- **CV Text Isolation**: Candidate-uploaded CV text is treated as untrusted and wrapped in isolation delimiters (`<<<UNTRUSTED_CV_TEXT>>>`) to mitigate prompt injection.
- **Strict Verification Filter**: Tailored resumes generated via Gemini are cross-checked by `validateTailoredCvHallucinations()`. Any technical skill or company name that does not exist in the candidate's original profile is automatically stripped before output.
- **Circuit Breaker**: Detects network connection timeouts (`UND_ERR_CONNECT_TIMEOUT`) to prevent connection hangs, ensuring instantaneous fallback recommendations.

---

## 📄 License
ISC License. Built for Sri Lankan developers.
