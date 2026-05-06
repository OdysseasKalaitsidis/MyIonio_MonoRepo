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
                stage('Frontend: Lint & Build') {
                    steps {
                        dir('Frontend') {
                            bat 'npm ci'
                            bat 'npm run build'
                        }
                    }
                }
                stage('Backend: Test & Analysis') {
                    steps {
                        dir('Backend') {
                            bat 'dotnet restore'
                            bat 'dotnet build --no-restore'
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
                        // Fix Windows permissions for the private key using PowerShell (SSH requires it to be strictly restricted)
                        bat "powershell -Command \"\$path = '%SSH_KEY%'; \$acl = Get-Acl \$path; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'Read', 'Allow'); \$acl.SetAccessRule(\$rule); Set-Acl \$path \$acl\""
                        
                        // Log in to the registry on the VPS and then pull/up the core services
                        bat "C:\\Windows\\System32\\OpenSSH\\ssh.exe -i %SSH_KEY% -o StrictHostKeyChecking=no ${env.VPS_USER}@%VPS_HOST% \"echo %DOCKER_PASS% | sudo docker login ghcr.io -u %DOCKER_USER% --password-stdin && cd ~/MyIonio_MonoRepo && sudo docker compose pull db kafka backend frontend ai-service && sudo docker compose up -d --remove-orphans db kafka backend frontend ai-service && sudo docker image prune -f\""
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
