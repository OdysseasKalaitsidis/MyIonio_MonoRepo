# MyIonio AI: Intelligent Academic Data Parser

This microservice is the core data engine of the MyIonio platform. it transforms unstructured university documents (PDFs, HTML tables, and text) into the structured JSON format required by the .NET Backend.

## 🤖 AI Integration: Gemini 2.0 Flash

The service utilizes the **Google Gemini 2.0 Flash** model to handle the inherent complexity and variability of university timetables. Unlike traditional regex-based scrapers, this AI-driven approach can:
- Standardize varying date formats and time slots.
- Correct typos in professor names.
- Extract structured course attributes (Theory vs. Lab) from natural language descriptions.
- Map semesters into a standardized Greek numeral system (Α, Β, Γ...).

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **LLM**: Google Gemini 2.0 Flash (via `google-genai` SDK)
- **Logging**: Loguru
- **Environment**: Dockerized for seamless deployment.

## 📁 Project Structure
- `api/`: FastAPI controllers and routes.
- `parser/`: Core parsing logic.
  - `gemini_parser.py`: The LLM-orchestration layer with structured output schemas.
  - `menu_parser.py`: Logic for extracting university restaurant menus.
- `models/`: Pydantic models for data validation.

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- A Google Gemini API Key.

### Installation
1. Navigate to the directory: `cd MyIonio-AI`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`

### Configuration
Create a `.env` file in the `MyIonio-AI` directory:
```env
GEMINI_API_KEY=your_api_key_here
```

### Running Locally
```bash
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. You can view the interactive Swagger documentation at `http://localhost:8000/docs`.

## 🐳 Docker Deployment
```bash
docker build -t myionio-ai .
docker run -p 8000:8000 --env-file .env myionio-ai
```
