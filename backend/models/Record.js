const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relativeName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number, // used for cash mode
      default: 0,
    },
    grams: {
      type: Number, // used for gold mode
      default: 0,
    },
    eventName: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      enum: ["cash", "gold"],
      required: true,
    },
    type: {
      type: String,
      enum: ["received", "given", "completed"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Record", RecordSchema);
