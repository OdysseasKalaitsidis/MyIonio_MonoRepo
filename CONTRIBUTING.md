# Contributing to MyIonio 🎓

First off, thank you for considering contributing to MyIonio! It's people like you that make MyIonio such a great tool for the Ionian University community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MyIonio_MonoRepo.git
   ```
3. **Set up the development environment** using Docker:
   ```bash
   cp .env.example .env
   docker compose up -d --build
   ```

## 🛠️ Development Workflow

### Frontend
The frontend is built with React 19 and Vite.
- Run `npm run build` to check for TypeScript errors.
- Follow the existing folder structure in `Frontend/src`.

### Backend
The backend is a .NET 8 Web API.
- Use `dotnet build` to verify compilation.
- Add unit tests to `Backend.Tests` for new features.

### Quality Checks
Before pushing, please run the verification script:
```powershell
.\pre-push-check.ps1
```

## 📬 Submitting a Pull Request

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with descriptive messages.
3. Push to your fork and open a Pull Request against the `master` branch.
4. Ensure your PR passes all CI checks.

## ⚖️ License
By contributing, you agree that your contributions will be licensed under its MIT License.
