import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import combinedRoutes from "./routes/index.js";
import { fileURLToPath } from 'url';

import chatController from './controllers/chatController.js';
import router from './routes/authRoutes.js';
import verifyToken from './middlewares/authMiddleware.js';
import socketMiddleware from './middlewares/socketMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Parse application/json and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Use combinedRoutes for handling routes starting with "/api"
app.use("/api", combinedRoutes);

// Use router for handling root-level routes
app.use("/", router);

// Define a route for rendering the welcome page
app.get('/', (req, res) => {
  res.send({ username: 'saransh pachhai' });
});

app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'));

app.use(verifyToken)

io.use(socketMiddleware);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, socket.userData);

  // Listen for 'newMessage' events from clients
  socket.on('newMessage', (data) => {
    console.log('Received new message:', data);
    chatController.sendMessage(io, socket, data);
  });

  // Listen for 'editMessage' events from clients
  socket.on('editMessage', (data) => {
    chatController.editMessage(io, socket, data);
  });

  // Listen for 'deleteMessage' events from clients
  socket.on('deleteMessage', (data) => {
    chatController.deleteMessage(io, socket, data);
  });

  // Listen for 'uploadFile' events from clients
  socket.on('uploadFile', (data) => {
    chatController.uploadFile(io, socket, data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
