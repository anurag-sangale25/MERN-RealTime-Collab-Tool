import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    content: {
      type: String,
      default: ""
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

export default mongoose.model("Document", documentSchema);
