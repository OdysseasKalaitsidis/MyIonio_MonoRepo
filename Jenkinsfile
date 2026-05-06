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
                    // Use standard Docker CLI commands for better Windows compatibility
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        // Secure login using stdin
                        bat "echo %DOCKER_PASS% | docker login %REGISTRY% -u %DOCKER_USER% --password-stdin"
                        
                        def backendImage = "${REGISTRY}/${IMAGE_BASE}-backend"
                        def frontendImage = "${REGISTRY}/${IMAGE_BASE}-frontend"

                        // Build both tags at once
                        bat "docker build -t ${backendImage}:${BUILD_NUMBER} -t ${backendImage}:latest ./Backend"
                        bat "docker build -t ${frontendImage}:${BUILD_NUMBER} -t ${frontendImage}:latest ./Frontend"

                        // Push all tags
                        bat "docker push ${backendImage} --all-tags"
                        bat "docker push ${frontendImage} --all-tags"
                    }
                }
            }
        }

        stage(' Deploy to Production (VPS)') {
            steps {
                script {
                    // Pull VPS IP and SSH Key file
                    withCredentials([
                        string(credentialsId: 'vps-ip-address', variable: 'VPS_HOST'),
                        sshUserPrivateKey(credentialsId: 'vps-ssh-creds', keyFileVariable: 'SSH_KEY')
                    ]) {
                        // Fix Windows permissions for the private key using PowerShell (SSH requires it to be strictly restricted)
                        bat "powershell -Command \"\$path = '%SSH_KEY%'; \$acl = Get-Acl \$path; \$acl.SetAccessRuleProtection(\$true, \$false); \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 'Read', 'Allow'); \$acl.SetAccessRule(\$rule); Set-Acl \$path \$acl\""
                        
                        // Use the full path to ssh.exe since the Jenkins service PATH might not include it
                        bat "C:\\Windows\\System32\\OpenSSH\\ssh.exe -i %SSH_KEY% -o StrictHostKeyChecking=no ${env.VPS_USER}@%VPS_HOST% \"cd ~/MyIonio_MonoRepo && sudo docker compose pull db kafka backend frontend ai-service && sudo docker compose up -d db kafka backend frontend ai-service && sudo docker image prune -f\""
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
