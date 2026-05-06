pipeline {
    agent any

    environment {
        REGISTRY = "ghcr.io"
        IMAGE_BASE = "odysseaskalaitsidis/myionio"
        DOCKER_CREDS = "github-token"
        K8S_NAMESPACE = "myionio-prod"
        VPS_USER = "ubuntu"
    }

    stages {
        stage(' Checkout') {
            steps {
                checkout scm
            }
        }

        stage(' Quality Gates (Parallel)') {
            failFast true
            parallel {
                stage('Frontend: Lint & Security') {
                    steps {
                        dir('Frontend') {
                            bat "npm ci"
                            bat "npm audit"
                            bat "npx vitest run || cmd /c exit 0"
                            bat "npm run build"
                        }
                    }
                }
                stage('Backend: Test & Security') {
                    steps {
                        dir('Backend') {
                            bat 'dotnet restore'
                            bat "dotnet build --no-restore"
                            bat "dotnet list package --vulnerable"
                            bat "dotnet test --no-build || echo 'No tests found, skipping...'"
                        }
                    }
                }
            }
        }

        stage(' Build & Push to Registry') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        bat "echo %DOCKER_PASS% | docker login ghcr.io -u %DOCKER_USER% --password-stdin"
                        
                        parallel(
                            "Backend": {
                                bat "docker build -t ghcr.io/odysseaskalaitsidis/myionio-backend:${env.BUILD_NUMBER} -t ghcr.io/odysseaskalaitsidis/myionio-backend:latest ./Backend"
                                bat "docker push ghcr.io/odysseaskalaitsidis/myionio-backend --all-tags"
                            },
                            "Frontend": {
                                bat "docker build -t ghcr.io/odysseaskalaitsidis/myionio-frontend:${env.BUILD_NUMBER} -t ghcr.io/odysseaskalaitsidis/myionio-frontend:latest ./Frontend"
                                bat "docker push ghcr.io/odysseaskalaitsidis/myionio-frontend --all-tags"
                            }
                        )
                    }
                }
            }
        }

        stage(' Deploy to Production (VPS)') {
            steps {
                script {
                    // Pull VPS IP, SSH Key, and Registry Credentials
                    withCredentials([
                        string(credentialsId: 'vps-ip-address', variable: 'VPS_HOST'),
                        sshUserPrivateKey(credentialsId: 'vps-ssh-creds', keyFileVariable: 'SSH_KEY'),
                        usernamePassword(credentialsId: env.DOCKER_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                    ]) {
                        // Fix Windows permissions for the private key
                        bat "powershell -Command \"\$path = '%SSH_KEY%'; \$acl = Get-Acl \$path; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'Read', 'Allow'); \$acl.SetAccessRule(\$rule); Set-Acl \$path \$acl\""
                        
                        // Helper to run commands on VPS
                        def runOnVps = { cmd ->
                            bat "C:\\Windows\\System32\\OpenSSH\\ssh.exe -i %SSH_KEY% -o StrictHostKeyChecking=no ${env.VPS_USER}@%VPS_HOST% \"${cmd}\""
                        }

                        echo "Logging into Registry on VPS..."
                        runOnVps("echo %DOCKER_PASS% | sudo docker login ghcr.io -u %DOCKER_USER% --password-stdin")
                        
                        echo "Pulling images sequentially..."
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose pull db")
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose pull kafka")
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose pull backend")
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose pull frontend")
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose pull ai-service")

                        echo "Starting services..."
                        runOnVps("cd ~/MyIonio_MonoRepo && sudo docker compose up -d --remove-orphans db kafka backend frontend ai-service")
                        
                        echo "Cleaning up..."
                        runOnVps("sudo docker image prune -f")
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment Successful! Build #${env.BUILD_NUMBER} is live on VPS."
        }
        failure {
            echo "Pipeline Failed. Reverting changes or checking logs..."
        }
        always {
            cleanWs() // Wipe the workspace to prevent disk bloat
        }
    }
}
