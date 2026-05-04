# MyIonio Monorepo

MyIonio is a full-stack, containerized academic platform engineered for the Ionian University student body. It supports a growing user base of over 4,000 university students by providing real-time schedule management, academic profiling, and intelligent course recommendations. Engineered from the ground up as a solo-developed platform, the project features a fully custom-built end-to-end architecture encompassing the frontend React application, the .NET Core backend API, the relational database structure, and the automated CI/CD deployment pipelines.

## Preview

<p align="center">
  <img src="docs/screenshots/dashboard.png" width="45%" alt="Dashboard" />
  <img src="docs/screenshots/schedule.png" width="45%" alt="Schedule View" />
</p>
<p align="center">
  <img src="docs/screenshots/semester_selection.png" width="45%" alt="Semester Selection" />
  <img src="docs/screenshots/course_selection.png" width="45%" alt="Course Selection" />
</p>

## Technology Stack

The platform is built upon a modern, high-performance tech stack designed for scalability, type safety, and maintainability:

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Redux Toolkit
*   **Backend**: ASP.NET Core 8.0 Web API, Entity Framework Core
*   **AI Data Parsing**: Python 3, FastAPI (Extracts and structures unstructured university schedules/menus)
*   **Database**: PostgreSQL
*   **DevOps & Infrastructure**: Docker, Docker Compose, GitHub Actions, Nginx Reverse Proxy
*   **Security**: JWT-based Authentication with HTTP-only Cookies

## Architecture Overview

The system utilizes a decoupled monorepo architecture. The frontend SPA communicates with a robust .NET Web API, which manages data persistence via Entity Framework Core connected to a PostgreSQL database. The entire stack is fully containerized using Docker, ensuring absolute environment parity between local development and the production server.

```mermaid
graph TD
    subgraph "User Layer"
        User[Client Browser]
    end

    subgraph "Cloud Infrastructure (VPS)"
        Nginx[Nginx Reverse Proxy]
        Frontend[React 19 SPA]
        Backend[.NET 8 Web API]
        AI[Python AI Service]
        DB[(PostgreSQL DB)]
    end

    User -->|HTTPS| Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Nginx --> AI
    Backend --> DB

    subgraph "CI/CD"
        GHA[GitHub Actions]
    end

    GHA -.->|Deploy| Nginx
```

## Developer Ownership

As a solo-engineered platform, core technical responsibilities and implementations span the entire development lifecycle:

*   **System Architecture**: Design of the decoupled architecture, RESTful API contracts, and normalized PostgreSQL database schemas.
*   **Frontend Engineering**: Development of a responsive, accessible, and highly interactive user interface focused on performance and modern UX principles.
*   **Backend Development**: Implementation of secure APIs, centralized exception handling, business logic, and efficient data access patterns in C#/.NET 8.
*   **AI & Data Engineering**: Development of a Python/FastAPI microservice to parse, structure, and serve unstructured university data.
*   **DevOps & CI/CD**: Containerization of all services using Docker and engineering of automated GitHub Actions workflows for seamless, zero-downtime deployments to a Linux VPS.
*   **Quality & Security**: Enforcement of code quality standards, implementation of rate limiting, and security hardening against common web vulnerabilities.

## Getting Started

### Local Environment Setup

To run the application locally, ensure you have Docker and Docker Compose installed.

1.  Clone the repository.
2.  Copy `.env.example` to `.env` and configure the necessary environment variables.
3.  Launch the containerized environment:

```bash
docker compose up -d --build
```

The frontend application will be accessible at `http://localhost:8080`, and the backend API documentation (Swagger) can be found at `http://localhost:5000/swagger`.

## Roadmap & Open Issues

Contributions from the open-source community are highly encouraged to help expand the platform. Current priorities include:

*   **Internationalization (i18n)**: Full English translation for the entire UI.
*   **Mobile App**: A React Native version leveraging the existing backend.
*   **Push Notifications**: Real-time alerts for schedule changes or announcements.
*   **Unit Tests**: Increasing test coverage for critical frontend business logic.
*   **Accessibility (A11y)**: Ensuring the platform is fully accessible to all users.

Please check the [Issues](https://github.com/YOUR_USERNAME/MyIonio_MonoRepo/issues) tab for feature requests and bug reports.

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please review the [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) files for details on our code of conduct and the process for submitting pull requests.

## License

This project is distributed under the MIT License.
