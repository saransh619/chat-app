import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender_id: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    required: true
  },
  receiver_id: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  file_upload: [
    {
      type: String
    }
  ],
},
{
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;