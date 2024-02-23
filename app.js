import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import combinedRoutes from "./routes/index.js";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve('./uploads/'));
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now() % 10000;
      const filename = `${timestamp}-${file.originalname.replace(/\s/g, '')}`;
      // Update the file object with the full path
      file.fullPath = path.join(__dirname, 'uploads', filename);
      cb(null, filename);
    },
  });
  
  const upload = multer({ storage });
app.use(upload.fields([{ name: 'files' }]));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Socket.IO connection handling
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Listen for 'newMessage' events from clients
    socket.on('newMessage', (data) => {
        // Broadcast the received message to all connected clients
        io.emit('newMessage', { message: data, senderId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Middleware to set up Socket.IO connection
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", combinedRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});