# --- CONFIGURATION ---
$VM_USER = "ubuntu"
$VM_IP = "158.180.57.158"
$REMOTE_DIR = "~/myionio-deploy"
# ---------------------

Write-Host "Starting deployment to $VM_USER@$VM_IP..." -ForegroundColor Cyan

# 1. Create a tarball of the project
Write-Host "Creating project bundle..." -ForegroundColor Yellow
$ROOT_DIR = if (Test-Path "$PSScriptRoot/../Backend") { "$PSScriptRoot/.." } else { "." }
$exclude = @("node_modules", ".git", "bin", "obj", "Frontend/dist", "Backend/publish", "MyIonio-Backend", "MyIonio-AI", "MyIonio-Frontend")
$excludeArgs = $exclude | ForEach-Object { "--exclude=$_" }
tar czf myionio.tar.gz -C $ROOT_DIR $excludeArgs .

# 2. Upload to VM
Write-Host "Uploading to VM..." -ForegroundColor Yellow
scp myionio.tar.gz "$($VM_USER)@$($VM_IP):~/"

# 3. Remote execution
Write-Host "Running Docker Compose on VM..." -ForegroundColor Yellow
$remote_commands = @"
mkdir -p $REMOTE_DIR
# Clean up redundant directories to prevent duplicate definition errors
rm -rf $REMOTE_DIR/MyIonio-Backend $REMOTE_DIR/Backend/MyIonio-Backend $REMOTE_DIR/MyIonio-AI $REMOTE_DIR/MyIonio-Frontend
tar -xzf ~/myionio.tar.gz -C $REMOTE_DIR
cd $REMOTE_DIR
docker compose up -d --build
rm ~/myionio.tar.gz
"@

ssh "$($VM_USER)@$($VM_IP)" $remote_commands

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Frontend: http://$VM_IP (Mapped via Nginx to port 8080)"
Write-Host "Backend API: http://$VM_IP:5000 (Mapped via Nginx)"
Write-Host "AI Service: http://$VM_IP:8000"
