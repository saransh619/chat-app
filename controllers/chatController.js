import path from 'path';
import fs from 'fs';
import Message from '../models/message.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const index = (req, res) => {
  const token = req.user?.token;
  const receiver_id = req.user?.userId
  console.log("receiver_id check", receiver_id);
  res.render('chat', { token, receiver_id });
};

const sendMessage = async (io, socket, data) => {
  console.log("data is", data);
  try {

    // Extract necessary data from the socket
    const sender_id = socket.userData?.userId;
    const { receiver_id, text, files } = data;
    console.log("receiver_id", receiver_id);
    console.log("text", text);
    console.log("files", files);
    
    // Validate required fields
    if (!sender_id || !receiver_id || !text) {
      console.warn('SenderId, ReceiverId, and Message are required');
      return;
    }

    // Create a new message
    const newMessage = new Message({
      sender_id,
      receiver_id,
      message: text,
      file_upload: files?.map(file => file.filename) || [],
    });

    // Save the message to the database
    const savedMessage = await newMessage.save();

    // Broadcast the message to connected clients
    io.emit('newMessage', { message: savedMessage });

    // Emit the message to the specified receiver, if online
    const receiverSocket = io.sockets.sockets.get(receiver_id);
    console.log("receiverSocket", receiverSocket);
    if (receiverSocket) {
      io.to(receiverSocket.id).emit('newMessage', { message: savedMessage });
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const editMessage = async (io, socket, data) => {
  try {
    const { messageId, newText } = data;

    const message = await Message.findById(messageId);
    if (!message) {
      return socket.emit('error', { message: 'Message not found' });
    }

    // Check if the user has the permission to edit the message
    if (message.sender_id.toString() !== socket.user.userId) {
      return socket.emit('error', { message: 'Permission denied' });
    }

    message.message = newText;
    await message.save();

    // Emit the edited message to connected Socket.IO clients
    io.emit('editedMessage', { message });

    socket.emit('messageEdited', { message: 'Message edited successfully' });
  } catch (error) {
    console.error(error);
    socket.emit('error', { message: 'Internal server error' });
  }
};

const deleteMessage = async (io, socket, data) => {
  try {
    const { messageId } = data;

    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return socket.emit('error', { message: 'Message not found' });
    }

    // Check if the user has the permission to delete the message
    if (deletedMessage.sender && deletedMessage.sender.toString() !== socket.user.userId) {
      return socket.emit('error', { message: 'Permission denied' });
    }

    // Delete associated files from the uploads folder
    deletedMessage.file_upload.forEach((filename) => {
      const filePath = path.join(__dirname, '../uploads/', filename);
      fs.unlinkSync(filePath);
    });

    // Emit the deleted message ID to connected Socket.IO clients
    io.emit('deletedMessage', { messageId });

    socket.emit('messageDeleted', { message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    socket.emit('error', { message: 'Internal server error' });
  }
};

const uploadFile = async (io, socket, data) => {
  try {
    if (!data.files || data.files.length === 0) {
      return socket.emit('error', { message: 'No files uploaded' });
    }

    // Process the uploaded files
    const filePaths = data.files.map(file => file.fullPath);

    // For simplicity, here, we are just storing the file paths in the database
    const sender = socket.user.userId;
    const newMessage = new Message({ sender_id: sender, file_upload: filePaths });
    await newMessage.save();

    // Emit the new message with files to connected Socket.IO clients
    io.emit('newMessage', { message: newMessage });

    socket.emit('filesUploaded', { message: 'Files uploaded successfully' });
  } catch (error) {
    console.error(error);
    socket.emit('error', { message: 'Internal server error' });
  }
};

export default { sendMessage, editMessage, deleteMessage, uploadFile, index };