
pipeline {
    agent any

    stages {
        

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
                    bat 'python -m pip install -r requirements.txt'
                }
            }
        }

        stage('Backend Check') {
            steps {
                dir('backend') {
                    bat 'python -m py_compile app.py'
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
