import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Message from '../models/message.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiver, text } = req.body;

    const newMessage = new Message({
      sender_id: senderId,
      receiver_id: receiver,
      message: text,
      file_upload: req.files?.files?.map(file => file.filename) || [],
    });

    await newMessage.save();

    // Find the receiver's socket by their user ID
    const receiverSocket = Object.values(req.io.sockets.sockets).find(
      (socket) => socket.user?.userId === receiver
    );

    if (receiverSocket) {
      receiverSocket.emit('newMessage', { message: newMessage });
    }

    res.status(201).json({ message: 'Message sent successfully', newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { receiver_id } = req.query;

    if (!receiver_id) {
      return res.status(400).json({ message: 'Receiver ID is required in the query string' });
    }

    console.log("receiver_id", receiver_id);
    const sender = req.user.userId;
    console.log("sender", sender);

    const messages = await Message.find({
      $or: [
        { sender_id: sender, receiver_id: receiver_id },
        { sender_id: receiver_id, receiver_id: sender },
      ],
    }).sort({ timestamps: 1 });

    console.log("messages", messages);

    // Emit messages to the requesting Socket.IO client
    req.io.to(req.user.userId).emit('messages', { messages });

    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user has the permission to edit the message
    if (message.sender_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    message.message = newText;
    await message.save();

    // Emit the edited message to connected Socket.IO clients
    req.io.emit('editedMessage', { message });

    res.status(200).json({ message: 'Message edited successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;

    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if the user has the permission to delete the message
    if (deletedMessage.sender && deletedMessage.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Delete associated files from the uploads folder
    deletedMessage.file_upload.forEach((filename) => {
      const filePath = path.join(__dirname, '../uploads/', filename);
      fs.unlinkSync(filePath);
    });

    // Emit the deleted message ID to connected Socket.IO clients
    req.io.emit('deletedMessage', { messageId });

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Process the uploaded files
    const filePaths = req.files.map(file => file.fullPath);

    // For simplicity, here, we are just storing the file paths in the database
    const sender = req.user.userId;
    const newMessage = new Message({ sender_id: sender, file_upload: filePaths });
    await newMessage.save();

    // Emit the new message with files to connected Socket.IO clients
    req.io.emit('newMessage', { message: newMessage });

    res.status(201).json({ message: 'Files uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export default { sendMessage, getMessages, editMessage, deleteMessage, uploadFile };
