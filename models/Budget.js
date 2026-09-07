const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcribers",
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ["Food", "Transport", "Rent", "Utility", "Healthcare", "Entertainment", "Shopping", "Other"]
  },
  limitAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: "UGX",
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

budgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
