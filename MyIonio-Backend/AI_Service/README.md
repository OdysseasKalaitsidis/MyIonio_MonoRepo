# IonioPortal AI Service

This service handles PDF parsing and AI-enriched schedule processing for the IonioPortal application.

## Setup

1.  Navigate to this directory:
    ```powershell
    cd AI_Service
    ```

2.  Create a virtual environment:
    ```powershell
    python -m venv venv
    ```

3.  Activate the virtual environment:
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```

4.  Install dependencies:
    ```powershell
    pip install -r requirements.txt
    ```

5.  Create a `.env` file with your Supabase credentials (see `.env.example` or ask the administrator).

## Running the Service

```powershell
uvicorn main:app --reload
```

The service will run on `http://localhost:8000` (default).

## API Documentation

Once running, visit `http://localhost:8000/docs` for the Swagger UI.
