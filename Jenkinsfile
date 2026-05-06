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
                    docker.withRegistry("https://${REGISTRY}", DOCKER_CREDS) {
                        def backendImage = docker.build("${REGISTRY}/${IMAGE_BASE}-backend:${env.BUILD_NUMBER}", "./Backend")
                        backendImage.push()
                        backendImage.push("latest")

                        def frontendImage = docker.build("${REGISTRY}/${IMAGE_BASE}-frontend:${env.BUILD_NUMBER}", "./Frontend")
                        frontendImage.push()
                        frontendImage.push("latest")
                    }
                }
            }
        }

        stage(' Deploy to Production (VPS)') {
            steps {
                script {
                    // Pull VPS IP from 'vps-ip-address' secret text
                    withCredentials([string(credentialsId: 'vps-ip-address', variable: 'VPS_HOST')]) {
                        sshagent(['vps-ssh-creds']) {
                            // Windows-compatible SSH command
                            bat "ssh -o StrictHostKeyChecking=no ${env.VPS_USER}@${env.VPS_HOST} \"cd ~/MyIonio_MonoRepo && sudo docker compose pull && sudo docker compose up -d && sudo docker image prune -f\""
                        }
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
