🎙️ Speech-to-Text Application

A full-stack web application that converts spoken audio into written text using multilingual AI speech recognition. Built with React, Flask, Python, Whisper, and SQLite, the application provides a simple interface for recording speech, viewing transcriptions, and managing transcription history.

📌 Table of Contents

- "Overview" (#-overview)
- "Features" (#-features)
- "Screenshots" (#-screenshots)
- "Technology Stack" (#-technology-stack)
- "System Architecture" (#-system-architecture)
- "Project Structure" (#-project-structure)
- "How It Works" (#-how-it-works)
- "Getting Started" (#-getting-started)
- "Configuration" (#-configuration)
- "Deployment" (#-deployment)
- "Limitations" (#-limitations)
- "Future Improvements" (#-future-improvements)

🚀 Overview

Speech-to-Text is a browser-based application designed to convert spoken language into text with the help of AI-powered speech recognition.

The application uses a React frontend to provide the user interface and a Python Flask backend to process audio and communicate with the speech recognition engine. SQLite is used to store transcription history.

The project explores the integration of frontend development, backend API design, database operations, and AI-based speech processing in one application.

✨ Features

- Voice Recording: Record speech through the browser's microphone.
- AI Speech Recognition: Convert recorded audio into text using the Whisper multilingual speech recognition model.
- Multilingual Transcription: Support for speech recognition in multiple languages, subject to model accuracy and configuration.
- Hindi-English Speech: Designed to handle Hindi and English speech, including mixed-language input. Results may vary for Hinglish and code-switching.
- Transcription Display: View the generated transcript in the application.
- Transcription History: Store and retrieve previous transcription records using SQLite.
- History Management: Edit or delete saved records where supported by the application.
- REST API: Connect the React interface to the Flask backend through HTTP requests.
- Responsive Web Interface: Access the application through a modern web browser.

🖼️ Screenshots

Add screenshots captured from the actual running application to the "docs/screenshots/" directory.

1. Application Home Page

<img width="1262" height="671" alt="Screenshot 2026-10-27 220109" src="https://github.com/user-attachments/assets/f718d457-fd72-471d-a4a7-a394c9f6c2ff" />

2. Transcription History

<img width="1059" height="544" alt="Screenshot 2026-10-27 220121" src="https://github.com/user-attachments/assets/28a028d5-1200-441f-bdc5-8524282465ff" />

The saved transcription records and available history-management actions.

«Replace these image paths with screenshots of your actual application. If a screenshot is not available yet, capture it before submitting the project.»

🛠️ Technology Stack

Technology| Purpose
React| Frontend user interface
JavaScript| Frontend application logic
Python| Backend programming language
Flask| REST API and backend request handling
faster-whisper| Speech recognition and transcription
SQLite| Persistent transcription history
HTML and CSS| Application structure and styling
Git and GitHub| Version control and source code hosting
Render| Frontend hosting; backend hosting must be configured separately

🏗️ System Architecture

The application follows a frontend-backend architecture.

User
  |
  v
React Frontend
  |
  | HTTP request containing recorded audio
  v
Flask REST API
  |
  v
Whisper Speech Recognition
  |
  | Transcribed text
  v
Flask Backend
  |
  +----> SQLite Database
  |
  v
React displays the transcription

Frontend: Captures microphone audio, sends requests to the backend, and displays transcription results.

Backend: Receives audio, processes it using the speech recognition model, and returns the generated text.

AI Model: Performs multilingual speech recognition using Whisper through the faster-whisper library.

Database: Stores transcription history for later retrieval and management.

📁 Project Structure

speech-to-text-rebuilt/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── package.json
│   └── ...
├── docs/
│   └── screenshots/
├── .gitignore
└── README.md

The structure above highlights the main application files. Other configuration files and source modules may also be present in the repository.

⚙️ How It Works

1. The user opens the web application in a browser.
2. The browser requests microphone permission when recording begins.
3. The application records the user's speech.
4. The recorded audio is sent to the Flask backend.
5. The backend processes the audio with the Whisper speech recognition model.
6. The backend returns the transcription result to the frontend.
7. The user views the generated text.
8. Transcription records can be stored in SQLite and managed through the history interface.

💻 Getting Started

Prerequisites

Install the following tools:

- Python 3.10 or a compatible version for the installed dependencies
- Node.js and npm
- Git
- A modern web browser with microphone access

1. Clone the Repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd speech-to-text-rebuilt

Replace "YOUR_GITHUB_REPOSITORY_URL" with the URL of this repository. If the cloned folder has a different name, enter that folder instead.

2. Set Up the Backend

Open a terminal in the project root.

cd backend
python -m venv venv

Activate the virtual environment on Windows:

venv\Scripts\activate

Install the Python dependencies:

pip install -r requirements.txt

Start the Flask application using the project's configured entry point:

python app.py

If the backend starts successfully, use the local API address configured by the application, typically "http://127.0.0.1:5000".

3. Set Up the Frontend

Open a second terminal in the project root.

cd frontend
npm install

Create or update the frontend environment configuration if needed:

VITE_API_BASE_URL=http://127.0.0.1:5000

Start the frontend using the script configured in "package.json". For a Vite project, this is typically:

npm run dev

Open the local URL displayed in the terminal.

«The exact Python version, frontend start command, and API address should match the configuration files in the repository.»

🔧 Configuration

The frontend uses "VITE_API_BASE_URL" to determine the backend API address when this variable is supported by the application.

For local development, the frontend and backend run separately.

For a hosted deployment, configure the frontend with the publicly reachable backend URL. A local address such as "127.0.0.1" refers to the user's own computer and will not connect a deployed frontend to a remote backend.

Do not commit passwords, secret keys, private environment files, or personal database contents to GitHub.

☁️ Deployment

The frontend is configured for deployment as a Render Static Site.

The frontend build command is:

cd frontend && npm install && npm run build

The publish directory is:

frontend/dist

The Flask backend requires a separate web service or another suitable Python hosting environment. Configure its start command, dependencies, model availability, and API URL according to the hosting environment.

A successful frontend deployment does not by itself confirm that the backend is deployed or that live transcription is working.

⚠️ Limitations

- Transcription accuracy depends on recording quality, accents, background noise, language, and model selection.
- Hindi-English code-switching and Romanized Hinglish may not always be transcribed exactly as spoken.
- Initial model loading or downloading may increase startup time.
- Browser microphone access requires permission and may depend on a secure context.
- The deployed frontend requires a reachable, correctly configured backend for transcription.
- Hosting memory, processing limits, and request timeouts may affect performance.

🔮 Future Improvements

- Improve Hinglish and code-switching transcription.
- Add audio-file upload support if not already available.
- Provide transcript export and copy-to-clipboard options.
- Improve loading indicators and error messages.
- Add automated backend and frontend tests.
- Improve accessibility and mobile responsiveness.
- Add deployment health checks and monitoring.

👩‍💻 Author

Vanditha Hamsa S. B.

GitHub: "vandithahamsaSb" (https://github.com/vandithahamsaSb)

---

Built as a full-stack project exploring AI-powered speech recognition, REST APIs, database integration, and modern web development.
