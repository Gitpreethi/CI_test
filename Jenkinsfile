
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Setup & Build') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }

        stage('Backend Setup') {
            steps {
                dir('backend') {
                    bat 'C:\\Users\\Preethi\\AppData\\Local\\Programs\\Python\\Python313\\python.exe -m pip install -r requirements.txt'
                }
            }
        }

        stage('Backend Check') {
            steps {
                dir('backend') {
                    bat 'C:\\Users\\Preethi\\AppData\\Local\\Programs\\Python\\Python313\\python.exe -m py_compile app.py'
                }
            }
        }
    }

    post {
        success {
            echo 'Build successful!'
        }
        failure {
            echo 'Build failed. Check the console output.'
        }
    }
}
