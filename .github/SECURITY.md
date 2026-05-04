# Security Policy

## Supported Versions

Please ensure you are running the latest version of the codebase. Security updates and patches are actively maintained for the current major version.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the MyIonio platform and our users' data extremely seriously. If you discover a security vulnerability, **please do not open a public GitHub issue.**

Instead, please report it privately to allow us time to investigate and patch the issue before public disclosure:

1. Send an email to **odysseaskalaitsides@gmail.com**.
2. Include a detailed description of the vulnerability.
3. Provide step-by-step instructions or a Proof of Concept (PoC) to reproduce the issue.

We will acknowledge your report within 48 hours, verify the vulnerability, and keep you updated on our progress toward a fix.

## Scope

This security policy applies to the proprietary source code of the MyIonio platform, including:
- The React / TypeScript Frontend
- The .NET 8 Backend API
- The Python / FastAPI AI Data Parser
- Automated CI/CD configurations

*Note: Third-party dependencies are actively monitored and automatically patched via GitHub Dependabot. If you discover a vulnerability in an underlying library, please refer to that specific project's security policy.*
