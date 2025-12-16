// server/models/CopyrightCheck.js
// Temporary storage for background copyright checks with automatic TTL cleanup

const mongoose = require("mongoose");

const CopyrightCheckSchema = new mongoose.Schema(
  {
    // Unique identifier for this check (returned to frontend)
    uploadId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Hash of the image for deduplication
    imageHash: {
      type: String,
      required: true,
      index: true
    },

    // User who uploaded
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    // Status of the check
    status: {
      type: String,
      enum: ["pending", "processing", "complete", "error"],
      default: "pending",
      index: true
    },

    // Copyright assessment result
    result: {
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "very_high"],
        default: null
      },
      matchCount: { type: Number, default: 0 },
      stockPhotoDetected: { type: Boolean, default: false },
      matchedUrls: [{ type: String }],
      recommendation: {
        type: String,
        enum: ["approve", "flag_for_review"],
        default: null
      },
      // Raw data from Vision API for debugging/audit
      webEntities: [{
        entityId: String,
        description: String,
        score: Number
      }],
      fullMatchingImages: [{ url: String }],
      pagesWithMatchingImages: [{
        url: String,
        pageTitle: String
      }],
      visuallySimilarImages: [{ url: String }]
    },

    // Error info if something went wrong
    error: { type: String, default: null },

    // Processing timestamps
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    // Auto-delete documents after 1 hour
    expireAfterSeconds: 3600
  }
);

// TTL index - documents expire 1 hour after creation
CopyrightCheckSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Compound index for user's pending checks
CopyrightCheckSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("CopyrightCheck", CopyrightCheckSchema);
