# Speech-to-Text App (Hindi + English mixed speech)

This project records audio in the browser, submits the completed recording to the Utter batch transcription API, and stores transcripts in SQLite.

**Important:** This version transcribes after you press Stop. It is not live partial-caption streaming.

## Requirements
- Python 3.10+
- Node.js 18+
- An Utter API key

## 1. Backend setup (Windows / VS Code)

Open a terminal in the `backend` folder:

```bat
py -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
```

Open `backend/.env` and replace `paste_your_utter_api_key_here` with your actual key. Do not commit or share `.env`.

Start the backend:

```bat
python app.py
```

Check `http://127.0.0.1:5000/`. It should say `Speech-to-Text API is running!`.

## 2. Frontend setup

Open a second terminal in the `frontend` folder:

```bat
npm install
npm run dev
```

Open the Local URL printed by Vite. Allow microphone access when prompted.

## 3. Test
1. Click Start recording.
2. Speak a sentence that switches between Hindi and English naturally.
3. Click Stop recording and wait for the transcript.
4. Click Save transcription.
5. Test editing and deleting a saved history item.

## Troubleshooting
- If the backend reports that `UTTER_API_KEY` is missing, check `backend/.env`, then restart Flask.
- If Utter returns an HTTP error, the app will display the status and a safe error message. Check the backend terminal for the provider response.
- Keep both terminals open during local use.
- `.env` is ignored by Git. Never put your key in React code or upload it to GitHub.

## Deployment
For deployment, set `UTTER_API_KEY` as a secret environment variable in the backend hosting dashboard. Set the frontend build variable `VITE_API_BASE_URL` to the deployed backend base URL (without `/api/...`), rebuild, and redeploy the frontend. Do not deploy the local `.env` file.
