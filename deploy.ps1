# --- CONFIGURATION ---
$VM_USER = "ubuntu"
$VM_IP = "158.180.57.158"
$REMOTE_DIR = "~/myionio-deploy"
# ---------------------

Write-Host "Starting deployment to $VM_USER@$VM_IP..." -ForegroundColor Cyan

# 1. Create a tarball of the project
Write-Host "Creating project bundle..." -ForegroundColor Yellow
$exclude = @("--exclude=node_modules", "--exclude=.git", "--exclude=bin", "--exclude=obj", "--exclude=Frontend/dist", "--exclude=Backend/publish", "--exclude=MyIonio-Backend", "--exclude=MyIonio-AI", "--exclude=MyIonio-Frontend")
tar czf myionio.tar.gz @exclude .

# 2. Upload to VM
Write-Host "Uploading to VM..." -ForegroundColor Yellow
scp myionio.tar.gz "$($VM_USER)@$($VM_IP):~/"

# 3. Remote execution
Write-Host "Running Docker Compose on VM..." -ForegroundColor Yellow
$remote_commands = @"
mkdir -p $REMOTE_DIR
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
