# webrtc-learn
Building Speech to Speech conversation AI agent using STT, TTT, TTS and transmitting over webrtc

## 📌 About This Project
This project consists of a **frontend, a Node.js backend, and a Python backend** that work together to process audio, perform speech recognition, and generate text-to-speech (TTS) outputs. It leverages **Deepgram, Google Cloud TTS, and Whisper** for speech-related tasks.

### 🔹 **Purpose**
- Provide real-time speech-to-text and text-to-speech processing.
- Handle voice activity detection (VAD) to enhance recognition accuracy.
- Support WebSocket communication for interactive audio applications.

### 🔹 **Tech Stack**
#### **Frontend (React + Vite)**
- React 18
- Vite
- TailwindCSS
- Socket.io Client

#### **Backend (Node.js + Express.js)**
- Express.js
- Deepgram SDK (speech processing)
- Google Cloud Text-to-Speech
- Socket.io (real-time communication)
- TypeScript

#### **Python Backend (FastAPI + Whisper)**
- FastAPI (REST API framework)
- Whisper (speech-to-text model)
- ffmpeg (audio processing)
- Uvicorn (ASGI server)

---

## 📂 Project Structure
```
.
├── backend                  # Node.js backend (Express + TypeScript)
│   ├── package.json         # Backend dependencies and scripts
│   ├── package-lock.json    # Dependency lock file
│   ├── postcss.config.js    # PostCSS config (for Tailwind)
│   ├── src/                 # Source code for backend
│   ├── tailwind.config.js   # TailwindCSS config
│   ├── tsconfig.json        # TypeScript config
│   └── tsconfig.tsbuildinfo # TypeScript build info
│
├── backend-python           # Python backend (FastAPI + Whisper)
│   ├── Dockerfile           # Docker setup for Python backend
│   ├── main.py              # FastAPI main entry point
│   ├── requirements.txt     # Python dependencies
│   ├── script.sh            # Helper script (if needed)
│   ├── test.py              # Test scripts
│   ├── test_whisper.py      # Whisper model test script
│   ├── tracks.py            # Handles audio processing
│   ├── TTS_demo.py          # Text-to-Speech demo
│   ├── whisper_online.py    # Whisper online processing script
│   └── whisper-server/      # Whisper-related server logic
│
├── frontend                 # React frontend (Vite + TailwindCSS)
│   ├── eslint.config.js     # ESLint configuration
│   ├── index.html           # Main HTML entry file
│   ├── package.json         # Frontend dependencies and scripts
│   ├── package-lock.json    # Dependency lock file
│   ├── postcss.config.js    # PostCSS configuration
│   ├── public/              # Static assets
│   ├── README.md            # Frontend-specific README
│   ├── src/                 # Source code for frontend
│   ├── tailwind.config.js   # TailwindCSS configuration
│   ├── tsconfig.app.json    # TypeScript config for app
│   ├── tsconfig.json        # TypeScript config
│   ├── tsconfig.node.json   # TypeScript config for Node.js
│   └── vite.config.ts       # Vite configuration
│
├── package-lock.json        # Root-level dependency lock file
└── README.md                # Main project README
```

---

## 🚀 How to Setup and Run

### 1️⃣ **Start the Python Backend**
The Python backend runs inside a **Docker container**.

```bash
cd backend-python
# Build the Docker image
docker build -t backend-python .

# Run the container on port 80
docker run --rm -p 80:80 backend-python
docker run -p 80:80 -v "C:\path\to\backend-python:/app" --rm backend-python
```
After running, FastAPI should be available at `http://localhost:80/docs`.

---

### 2️⃣ **Start the Node.js Backend**
The Node.js backend needs TypeScript compilation before running.

```bash
cd backend
npm install    # Install dependencies
npm run dev    # Build & start the backend
```
This will start the server and listen for API requests.

---

### 3️⃣ **Start the Frontend**
Run the following commands to start the **React frontend**:

```bash
cd frontend
npm install    # Install dependencies
npm run dev    # Start the frontend on http://localhost:5173/
```

---

## 🔍 Testing the Setup
Once all services are running:

✅ **Check Python API** → `http://localhost:80/docs` (FastAPI Swagger UI)  
✅ **Check Node.js API** → `http://localhost:3000` (Adjust port if needed)  
✅ **Check Frontend** → `http://localhost:5173/`

---

## 📌 Notes
- Ensure API calls in the frontend point to the correct backend endpoints.
- Use Postman or `curl` to manually test API endpoints.
- If running services on different machines, update the frontend API URLs accordingly.

🚀 **Now you’re ready to go!** 🎯

