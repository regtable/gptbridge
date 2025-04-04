import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  user_id: String,
  message_id: String,
  payload: String,
  timestamp: String,
  direction: String,
  metadata: Object
});

export default mongoose.model('Message', MessageSchema);
