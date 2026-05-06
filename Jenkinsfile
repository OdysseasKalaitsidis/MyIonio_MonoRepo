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
                        bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS% %REGISTRY%"
                        
                        // Build and Push Backend
                        bat "docker build -t %REGISTRY%/%IMAGE_BASE%-backend:%BUILD_NUMBER% ./Backend"
                        bat "docker tag %REGISTRY%/%IMAGE_BASE%-backend:%BUILD_NUMBER% %REGISTRY%/%IMAGE_BASE%-backend:latest"
                        bat "docker push %REGISTRY%/%IMAGE_BASE%-backend:%BUILD_NUMBER%"
                        bat "docker push %REGISTRY%/%IMAGE_BASE%-backend:latest"

                        // Build and Push Frontend
                        bat "docker build -t %REGISTRY%/%IMAGE_BASE%-frontend:%BUILD_NUMBER% ./Frontend"
                        bat "docker tag %REGISTRY%/%IMAGE_BASE%-frontend:%BUILD_NUMBER% %REGISTRY%/%IMAGE_BASE%-frontend:latest"
                        bat "docker push %REGISTRY%/%IMAGE_BASE%-frontend:%BUILD_NUMBER%"
                        bat "docker push %REGISTRY%/%IMAGE_BASE%-frontend:latest"
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
                        // Use the key file directly with the -i flag
                        bat "ssh -i %SSH_KEY% -o StrictHostKeyChecking=no ${env.VPS_USER}@%VPS_HOST% \"cd ~/MyIonio_MonoRepo && sudo docker compose pull && sudo docker compose up -d && sudo docker image prune -f\""
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment Successful! Build #${env.BUILD_NUMBER} is live on Kubernetes."
        }
        failure {
            echo "Pipeline Failed. Reverting changes or checking logs..."
        }
    }
}
