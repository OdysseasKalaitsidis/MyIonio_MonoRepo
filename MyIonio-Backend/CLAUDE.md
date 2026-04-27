# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IonioPortal is a three-tier university portal with personalized major recommendations, class/exam scheduling, and dining information. Three separate services:

- **Backend/** — ASP.NET Core 8.0 REST API (C#)
- **Frontend/** — React 19 + TypeScript + Vite SPA
- **AI_Service/** — FastAPI Python service for PDF parsing (schedules, menus) using Gemini AI

## Commands

### Backend
```bash
cd Backend
dotnet build
dotnet run                              # Development server
dotnet ef migrations add <Name>
dotnet ef database update
```

### Frontend
```bash
cd Frontend
npm install
npm run dev        # Vite dev server on port 5173
npm run build      # tsc -b && vite build
npm run preview
npm run lint       # ESLint
```

### AI Service
```bash
cd AI_Service
python -m venv venv
source venv/bin/activate               # or .\venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn main:app --reload              # http://localhost:8000, Swagger at /docs
```

## Architecture

### Data Flow
1. Frontend (React/Redux) → Backend (ASP.NET Core) via Axios with JWT Bearer tokens
2. Backend → PostgreSQL (Supabase) via Entity Framework Core 9
3. AI Service → Supabase directly for schedule/menu PDF parsing
4. Backend fetches AI-processed data from AI Service (`http://localhost:8000`)

### Backend Structure
- **Auth/**: JWT + Google OAuth authentication (token issue, refresh, Google ID token validation)
- **Controllers/**: Route handlers — quiz questions, recommendations, schedules, menus, exam schedules, courses
- **Services/**: Business logic implementing interfaces in Interfaces/
- **Models/**: EF Core entities; several use PostgreSQL JSONB columns (e.g., `Dictionary<string, int>` scoring, `List<>` for menu items)
- **DTOs/**: Request/response shapes, kept separate from domain models
- **Data/AppDbContext.cs**: EF Core context; `SeedData.cs` seeds Majors, Toolboxes, Questions

**Authentication flow:** Frontend sends Google ID token → Backend validates via `GoogleJsonWebSignature.ValidateAsync()` → issues JWT (5h expiry) + Refresh token (7d expiry, stored in DB). Rate limiting: 60 req/min globally, 3 signups/hour per IP.

### Frontend Structure
- **src/app/**: Redux store with `authSlice` and `preferencesSlice`
- **src/features/**: Feature slices (auth, quiz, results, menu, schedule, courses, preferences) — each contains Redux slice + API calls
- **src/pages/**: Page-level components (Dashboard, QuizPage, ResultsPage, SignInPage, SignUpPage, SchedulePage, MenuPage, ExaminationPage, LibraryPage)
- **src/lib/axios.ts**: Axios instance — reads `VITE_API_URL` env var, injects `Authorization: Bearer <token>`, redirects to `/login` on 401
- **src/data/UniData.ts**: Static university data

Styling: Tailwind CSS with custom Ionian blue theme, Poppins font, dark mode support. Component libraries: Headless UI, Lucide icons, Framer Motion, Recharts.

### AI Service Structure
- **api/controllers/**: FastAPI route handlers for `/schedule/` and `/menu/`
- **api/services/**: Business logic for schedule and menu processing
- **parser/**: `menu_parser.py` and `gemini_parser.py` for PDF/text extraction with Gemini AI
- **models/**: Pydantic models for exam_schedule, schedule, menu
- **db/supabase_client.py**: Supabase connection

### Environment Variables
- **Backend**: `appsettings.json` — PostgreSQL connection string (Supabase), JWT settings, Google OAuth ClientId/ClientSecret, CORS origins, OpenAI API key. Secrets managed via `dotnet user-secrets` (ID: `IonioPortal-Dev-Secret`).
- **Frontend**: `.env` file with `VITE_API_URL` pointing to Backend.
- **AI Service**: `.env` file with Supabase URL and key (see `.env.example`).

## Key Domain Concepts

- **Majors & Toolboxes**: Curriculum categories that questions map to via `QuestionForMajor` / `QuestionForToolbox` join tables with weights
- **Scoring**: User answers accumulate points per Major/Toolbox stored as `Dictionary<string, int>`; `ScoreTracker` helper computes recommendations
- **UserRecommendation**: Generated after quiz completion — stores ranked Majors and Toolboxes for a user
- **Schedules**: Two types — class schedules (weekly timetable) and exam schedules; both parsed from PDFs by AI Service and stored in Supabase
