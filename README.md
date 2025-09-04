# MERN Screen Recorder Take-Home Assignment

## Project Overview

This project is a web-based screen recorder application built with the MERN stack (using SQLite instead of MongoDB). It allows users to record their current browser tab with microphone audio, preview the recording, download it, and upload it to a Node.js backend where the metadata is stored in an SQL database.

### Core Features

- **Frontend (React):**
  - Record the current browser tab with microphone audio
  - Start/Stop recording controls
  - Live recording timer (max 3 minutes)
  - Video preview player after recording
  - Download the recording as a `.webm` file
  - Upload the recording to the backend
  - View a list of previously uploaded recordings

- **Backend (Node.js & Express):**
  - API endpoints to handle file uploads, list recordings, and stream specific recordings
  - File handling using `multer`
  - Metadata storage in SQLite database

- **Database (SQLite):**
  - Single table to store recording metadata like filename, file path, size, and creation date

## Technology Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **File Handling:** Multer for file uploads
- **Web APIs:** `navigator.mediaDevices.getDisplayMedia`, `MediaRecorder`

## Project Structure

```
/aflex
|-- /frontend
|   |-- src
|   |   |-- App.jsx       # Main React component
|   |-- package.json
|
|-- /backend
|   |-- /uploads          # Directory to store uploaded recordings
|   |-- server.js         # Express server and API logic
|   |-- database.db       # SQLite database file
|   |-- package.json
|
|-- README.md             # This file
```

## Local Development Setup

### Prerequisites

- Node.js and npm installed
- A modern web browser that supports the `MediaRecorder` API (Chrome, Firefox)

### Step 1: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:3000`. It will create the `database.db` file and the `recordings` table if they don't exist.

### Step 2: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm run dev
   ```
   
   The React app will open in your browser at `http://localhost:5173`.

## API Endpoints

- **`POST /api/recordings`** - Upload a new video recording
- **`GET /api/recordings`** - Retrieve list of all uploaded recordings
- **`GET /api/recordings/:id`** - Stream a specific video recording

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary Key, Auto Increment |
| `filename` | TEXT | Original filename for the recording |
| `filepath` | TEXT | Path where the file is stored on the server |
| `filesize` | INTEGER | Size of the file in bytes |
| `createdAt` | TIMESTAMP | Timestamp of when the recording was uploaded |

## Usage

1. Click "Start Recording" to begin screen capture
2. Select the browser tab you want to record
3. Recording will automatically stop at 3 minutes or click "Stop Recording"
4. Preview your recording in the video player
5. Download the recording or upload it to the server
6. View all uploaded recordings in the list below