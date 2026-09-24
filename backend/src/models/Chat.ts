import mongoose, { Document, Schema, Types } from "mongoose";

export interface IChat extends Document {
  users: Types.ObjectId[];
  latestMessage?: {
    text: string;
    sender: Types.ObjectId | string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema: Schema<IChat> = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    latestMessage: {
      text: { type: String, default: "" },
      sender: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
