const mongoose = require("mongoose");

const whiteboardObjectSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    objectId: {
      type: String,
      required: true,
      trim: true,
    },
    props: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    pathData: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    creatorId: {
      type: String,
      trim: true,
      default: null,
    },
    creatorDisplayName: {
      type: String,
      trim: true,
      default: null,
    },
    creatorRole: {
      type: String,
      enum: ["guest", "member", null],
      default: null,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

const whiteboardSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      ref: "Room",
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    objects: {
      type: [whiteboardObjectSchema],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

whiteboardSchema.index({ roomId: 1, "objects.objectId": 1 });

module.exports =
  mongoose.models.Whiteboard || mongoose.model("Whiteboard", whiteboardSchema);
