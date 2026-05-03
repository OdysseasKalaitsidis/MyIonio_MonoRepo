# MyIonio Monorepo

Welcome to the MyIonio Monorepo. This project is a comprehensive platform designed for the Ionian University community, featuring a robust .NET backend and a modern React frontend.

## 📁 Repository Structure

- **[Backend/](file:///c:/ODYSSEAS/A_PROJECTS/MyIonio_MonoRepo/Backend)**: ASP.NET Core 8.0 Web API.
- **[Frontend/](file:///c:/ODYSSEAS/A_PROJECTS/MyIonio_MonoRepo/Frontend)**: React 19 + Vite + TypeScript application.
- **[scripts/](file:///c:/ODYSSEAS/A_PROJECTS/MyIonio_MonoRepo/scripts)**: Deployment and maintenance scripts.
- **[docker-compose.yml](file:///c:/ODYSSEAS/A_PROJECTS/MyIonio_MonoRepo/docker-compose.yml)**: Orchestration for local and production deployment.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- .NET 8.0 SDK (for local backend development)
- Node.js 20.x (for local frontend development)

### Running with Docker
The easiest way to get the entire stack running is using Docker Compose:
```bash
docker compose up -d --build
```
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000/swagger

### Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
cp .env.example .env
```

## 🛠️ Development

### Backend
```bash
cd Backend
dotnet run
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## 🚢 Deployment
Deployment is automated via PowerShell. See the `scripts/` directory for more details.
To deploy to the production VM:
```powershell
./scripts/deploy.ps1
```

## 📝 License
This project is licensed under the MIT License - see the [Frontend/LICENSE](file:///c:/ODYSSEAS/A_PROJECTS/MyIonio_MonoRepo/Frontend/LICENSE) file for details.
