# MyIonio Pre-push Verification Script
# Run this before pushing to ensure everything compiles!

Write-Host "🚀 Starting Pre-push Checks..." -ForegroundColor Cyan

# 1. Frontend Check
Write-Host "`n🎨 Checking Frontend..." -ForegroundColor Yellow
cd Frontend
Write-Host "📦 Installing dependencies..."
npm install
Write-Host "⚙️  Building and Type-checking..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend Build Failed!" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

# 2. Backend Check
Write-Host "`n🖥️  Checking Backend..." -ForegroundColor Yellow
cd Backend
Write-Host "⚙️  Building Solution..."
dotnet build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend Build Failed!" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

# 3. Backend Tests
Write-Host "`n🧪 Running Backend Tests..." -ForegroundColor Yellow
cd Backend.Tests
dotnet test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend Tests Failed!" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

Write-Host "`n✅ All checks passed! Ready to push." -ForegroundColor Green
