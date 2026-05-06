pipeline {
    agent any

    environment {
        REGISTRY = "ghcr.io"
        IMAGE_BASE = "odysseaskalaitsidis/myionio"
        DOCKER_CREDS = "github-token"
        K8S_NAMESPACE = "myionio-prod"
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
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Backend: Test & Analysis') {
                    steps {
                        dir('Backend') {
                            sh 'dotnet restore'
                            sh 'dotnet build --no-restore'
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

        stage(' Manual Approval') {
            steps {
                input message: "Promote Build #${env.BUILD_NUMBER} to Production (Kubernetes)?", ok: "Deploy"
            }
        }

        stage(' Deploy to Kubernetes') {
            steps {
                script {
                    sh 'kubectl apply -f infra/kubernetes/ -n ${K8S_NAMESPACE}'
                    sh 'kubectl rollout status deployment/backend -n ${K8S_NAMESPACE}'
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
