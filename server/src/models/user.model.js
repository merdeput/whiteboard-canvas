const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
