const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      trim: true,
    },
    id: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["guest", "member"],
    },
  },
  {
    _id: false,
  }
);

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: String,
      ref: "User",
      required: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

roomSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.models.Room || mongoose.model("Room", roomSchema);
