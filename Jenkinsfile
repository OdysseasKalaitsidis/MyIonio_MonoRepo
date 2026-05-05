pipeline {
    agent any

    environment {
        // Define common variables for the pipeline
        REGISTRY = "ghcr.io"
        IMAGE_BASE = "odysseaskalaitsidis/myionio" // Adjusted to your repo owner
        DOCKER_CREDS = "github-token" // ID of the credential stored in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Quality Gate') {
            parallel {
                stage('Frontend Checks') {
                    steps {
                        dir('Frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Backend Checks') {
                    steps {
                        dir('Backend') {
                            sh 'dotnet restore'
                            sh 'dotnet build --no-restore'
                        }
                        dir('Backend.Tests') {
                            sh 'dotnet test --no-build --verbosity normal'
                        }
                    }
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", DOCKER_CREDS) {
                        // Build and Push Backend
                        def backendImage = docker.build("${REGISTRY}/${IMAGE_BASE}-backend:latest", "./Backend")
                        backendImage.push()

                        // Build and Push Frontend
                        def frontendImage = docker.build("${REGISTRY}/${IMAGE_BASE}-frontend:latest", "--build-arg VITE_API_URL=https://api.myionio.site/api ./Frontend")
                        frontendImage.push()

                        // Build and Push AI
                        def aiImage = docker.build("${REGISTRY}/${IMAGE_BASE}-ai:latest", "./MyIonio-AI")
                        aiImage.push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // This stage assumes you have 'kubectl' configured on your Jenkins agent
                // or you are using a Jenkins K8s plugin.
                sh 'kubectl apply -f infra/kubernetes/'
                sh 'kubectl rollout restart deployment -n myionio'
            }
        }
    }

    post {
        always {
            cleanWs() // Clean workspace after the run
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
