import express from "express";
import cors from "cors";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// SQLite DB
const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
});

// Create table if not exists
await db.exec(`
  CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    filepath TEXT,
    filesize INTEGER,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Upload recording
app.post("/api/recordings", upload.single("video"), async (req, res) => {
    try {
        const { filename, path: filepath, size } = req.file;
        const result = await db.run(
            "INSERT INTO recordings (filename, filepath, filesize) VALUES (?, ?, ?)",
            [filename, filepath, size]
        );
        res.status(201).json({
            message: "Recording uploaded successfully",
            recording: { id: result.lastID, filename, filepath, filesize: size },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all recordings
app.get("/api/recordings", async (req, res) => {
    const rows = await db.all("SELECT * FROM recordings ORDER BY createdAt DESC");
    res.json(rows);
});

// Stream specific recording
app.get("/api/recordings/:id", async (req, res) => {
    const recording = await db.get("SELECT * FROM recordings WHERE id = ?", [
        req.params.id,
    ]);
    if (!recording) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.resolve(recording.filepath));
});

// Delete recording
app.delete("/api/recordings/:id", async (req, res) => {
    try {
        // Find the recording in database
        const recording = await db.get("SELECT * FROM recordings WHERE id = ?", [
            req.params.id,
        ]);
        if (!recording) return res.status(404).json({ error: "Recording not found" });

        // Delete physical file from filesystem
        if (fs.existsSync(recording.filepath)) {
            fs.unlinkSync(recording.filepath);
        }

        // Delete record from database
        await db.run("DELETE FROM recordings WHERE id = ?", [req.params.id]);

        res.json({ message: "Recording deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
