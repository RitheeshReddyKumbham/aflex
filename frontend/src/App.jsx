import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_URL = "https://aflex-3.onrender.com/api/recordings";
const MAX_RECORDING_TIME = 180;

function App() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, filename: '' });
  const chunks = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRecordings(res.data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "video/webm" });
        setVideoURL(URL.createObjectURL(blob));
        chunks.current = [];
        clearInterval(timerRef.current);
        setRecordingTime(0);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      alert('Error accessing screen: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadVideo = () => {
    const a = document.createElement("a");
    a.href = videoURL;
    a.download = "recording.webm";
    a.click();
  };

  const uploadVideo = async () => {
    try {
      setUploading(true);
      const blob = await fetch(videoURL).then((res) => res.blob());
      const formData = new FormData();
      formData.append("video", blob, `recording-${Date.now()}.webm`);
      await axios.post(API_URL, formData);
      await fetchRecordings();
      setVideoURL(null);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const showDeleteModal = (id, filename) => {
    setDeleteModal({ show: true, id, filename });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${deleteModal.id}`);
      await fetchRecordings();
      setDeleteModal({ show: false, id: null, filename: '' });
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, id: null, filename: '' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">🎬 Screen Recorder</h1>
          <p className="text-blue-100">Record, preview, and manage your screen recordings</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Recording Controls */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-3 h-3 rounded-full mr-3 ${recording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className={`font-semibold ${recording ? 'text-red-600' : 'text-green-600'}`}>
                  {recording ? 'Recording in Progress' : 'Ready to Record'}
                </span>
              </div>

              {recording && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-mono text-red-600 mb-2">
                    {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {!recording ? (
                <button
                  onClick={startRecording}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                >
                  🎥 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors animate-pulse"
                >
                  ⏹️ Stop Recording
                </button>
              )}
            </div>
          </div>

          {/* Recording Preview */}
          {videoURL && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Recording Preview</h2>
              <div className="bg-black rounded-lg p-4 mb-4 flex justify-center">
                <video
                  src={videoURL}
                  controls
                  className="rounded"
                  style={{ width: '50vw', height: '50vh' }}
                />
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={downloadVideo}
                  className="bg-green-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  📥 Download
                </button>
                <button
                  onClick={uploadVideo}
                  disabled={uploading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                >
                  {uploading ? 'Uploading...' : '☁️ Upload'}
                </button>
              </div>
            </div>
          )}

          {/* Recordings Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Recordings Library ({recordings.length})</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading recordings...</p>
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎬</div>
                <p className="text-gray-500">No recordings yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {recordings.map((rec) => (
                  <div key={rec.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="bg-black rounded mb-3 relative overflow-hidden" style={{ width: '300px', height: '200px' }}>
                      <video
                        src={`${API_URL}/${rec.id}`}
                        className="object-cover cursor-pointer w-full h-full"
                        onClick={() => setExpandedVideo(rec.id)}
                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23fff' font-size='30'%3E▶%3C/text%3E%3C/svg%3E"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 truncate">{rec.filename}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Size: {(rec.filesize / 1024 / 1024).toFixed(2)} MB</p>
                      <p>Date: {new Date(rec.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setExpandedVideo(rec.id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded text-xs font-medium transition-colors"
                      >
                        ▶️ Play
                      </button>
                      <a
                        href={`${API_URL}/${rec.id}`}
                        onClick={downloadVideo}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded text-xs font-medium transition-colors text-center"
                      >
                        📥 Download
                      </a>
                      <button
                        onClick={() => showDeleteModal(rec.id, rec.filename)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded text-xs font-medium transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fullscreen Video Modal */}
      {expandedVideo && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setExpandedVideo(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <video
              src={`${API_URL}/${expandedVideo}`}
              controls
              autoPlay
              className="rounded-lg"
              style={{ width: '60vw', height: '60vh' }}
            />
            <button
              onClick={() => setExpandedVideo(null)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Recording</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteModal.filename}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-300">Built with React, Node.js, Express & SQLite • Max recording time: 3 minutes</p>
        </div>
      </footer>
    </div>
  );
}

export default App;