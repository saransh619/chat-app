import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: Object,
    required: true
  },
  receiver_id: {
    type: Object,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  file_upload: [
    {
      type: Object
    }
  ],
},
  {
    timestamps: true
  });

const Message = mongoose.model('Message', messageSchema);

export default Message;