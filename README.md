# MyIonio Monorepo

Welcome to the MyIonio Monorepo. This project is a comprehensive platform designed for the Ionian University community, featuring a robust .NET backend and a modern React frontend.

## 📁 Repository Structure

- **[Backend/](Backend)**: ASP.NET Core 8.0 Web API.
- **[Frontend/](Frontend)**: React 19 + Vite + TypeScript application.
- **[.github/workflows/](.github/workflows)**: CI/CD automation via GitHub Actions.
- **[scripts/](scripts)**: Deployment and maintenance scripts.
- **[docker-compose.yml](docker-compose.yml)**: Orchestration for local and production deployment.

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

### GitHub Actions (Automated)
The project is configured with GitHub Actions for automated deployment to the VPS on every push to the `master` branch.
Required Secrets in GitHub:
- `SSH_HOST`: VPS IP/Domain
- `SSH_USER`: SSH Username
- `SSH_PRIVATE_KEY`: Private SSH Key
- `SERVER_PATH`: Absolute path to repo on server

### Manual Deployment
You can also use the provided PowerShell script for manual deployment:
```powershell
./scripts/deploy.ps1
```

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
