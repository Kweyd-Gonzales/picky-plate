// server/routes/recipes.js
const express = require("express");
const Recipe = require("../models/Recipe");
const { protect } = require("../middleware/auth");
const { analyzeImage, quickSafetyCheck, generateImageHash } = require("../services/imageModeration");
const { analyzeRecipeText, quickSpamCheck } = require("../utils/spamDetection");
const {
  getCheckStatus,
  getCheckByUploadId,
  getCheckByImageHash
} = require("../services/copyrightDetection");

const router = express.Router();
const RecipeReport = require('../models/RecipeReport');

function devImpersonate(req, _res, next) {
  if (process.env.NODE_ENV !== "production") {
    const id = req.headers["x-impersonate-user-id"];
    if (id && /^[0-9a-fA-F]{24}$/.test(String(id))) {
      req.user = { ...(req.user || {}), id: String(id), _id: String(id), email: `dev+${String(id).slice(-6)}@local` };
    }
  }
  next();
}

// ---- Helpers ----
function calcReportStats(reports) {
  const arr = Array.isArray(reports) ? reports : [];
  const lifetime = arr.length;
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const weekly = arr.filter((r) => {
    const t = r?.createdAt ? new Date(r.createdAt).getTime() : 0;
    return t >= weekAgoMs;
  }).length;

  return { lifetime, weekly };
}

function escapeRegExp(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Calculate similarity between two strings (Jaccard similarity on words)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

/**
 * GET /api/recipes
 * Optional query:
 *  - search: text search across title/description/ingredients/instructions
 *  - tags: comma-separated list of tags (ANY)
 *  - exclude: comma-separated list (exclude allergens/tags/text matches)
 *  - prep, cook, diff, servings: exact string matches
 *  - authorId: show "my recipes" (matches createdBy if ObjectId OR author string)
 *  - page, limit
 *  - lite: if "true", exclude image field for faster initial load
 */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      tags = "",
      exclude = "",
      prep = "",
      cook = "",
      diff = "",
      servings = "",
      authorId = "",
      page = 1,
      limit = 20,
      lite = "false",
    } = req.query;

    const isLiteMode = lite === "true";

    const q = {
      state: { $ne: "forReview" }, // Exclude recipes that are marked as "forReview"
      isFlagged: { $ne: true }, // Exclude flagged recipes (5+ reports/week or 20+ lifetime)
    };

    // Text search across fields
    if (search) {
      const rx = new RegExp(escapeRegExp(search.trim()), "i");
      q.$or = [{ title: rx }, { description: rx }, { ingredients: rx }, { instructions: rx }];
    }

    // Tags (ANY)
    if (tags) {
      const list = String(tags)
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (list.length) q.tags = { $in: list };
    }

    // Exact-match dropdown filters
    if (prep) q.prepTime = prep;
    if (cook) q.cookTime = cook;
    if (diff) q.difficulty = diff;
    if (servings) q.servings = servings;

    // Exclusions (allergens/tags/text)
    const excludes = String(exclude)
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    if (excludes.length) {
      const andClauses = excludes.map((al) => {
        const safe = escapeRegExp(al);
        const rx = new RegExp(`\\b${safe}\\b`, "i");
        return {
          $nor: [
            { allergens: al }, // allergens array exact
            { tags: al }, // tags array exact
            { ingredients: rx }, // mention in ingredients text
            { description: rx }, // mention in description
            { title: rx }, // mention in title
          ],
        };
      });
      q.$and = (q.$and || []).concat(andClauses);
    }

    // "My Recipes" filter (createdBy ObjectId or author string equals)
    if (authorId) {
      const safe = String(authorId).trim();
      const or = [{ author: new RegExp(`^${escapeRegExp(safe)}$`, "i") }];
      if (/^[0-9a-fA-F]{24}$/.test(safe)) {
        const mongoose = require('mongoose');
        or.push({ createdBy: new mongoose.Types.ObjectId(safe) });
      }
      q.$and = (q.$and || []).concat([{ $or: or }]);
    }

    // Pagination
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // Who is asking (to mark reportedByMe)
    const userHeaderId = (req.headers["x-user-id"] || "").toString();

    // Query - exclude image in lite mode for faster initial load
    const projection = isLiteMode ? { image: 0 } : {};
    const [rawItems, total] = await Promise.all([
      Recipe.find(q, projection)
        .populate('createdBy', 'name email') // Populate user for current name
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      Recipe.countDocuments(q),
    ]);

    // Decorate with counters and flags
    const items = rawItems.map((doc) => {
      const { lifetime, weekly } = calcReportStats(doc.reports);
      const reportedByMe =
        userHeaderId &&
        Array.isArray(doc.reports) &&
        doc.reports.some((r) => String(r.user) === userHeaderId);

      // Use populated user's current name, fallback to stored author
      const displayAuthor = doc.createdBy?.name || doc.createdBy?.email || doc.author || "Anonymous";

      return {
        ...doc,
        author: displayAuthor, // Override with current user name
        reportsCount: lifetime, // lifetime total
        weeklyReports: weekly, // last 7 days
        reportedByMe,
      };
    });

    res.json({
      items,
      total,
      page: p,
      pages: Math.ceil(total / l),
    });
  } catch (e) {
    // console.error("recipes_list_error:", e);
    res.status(500).json({ success: false, error: "list_failed" });
  }
});

/**
 * GET /api/recipes/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userHeaderId = (req.headers["x-user-id"] || "").toString();
    const doc = await Recipe.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();
    if (!doc) return res.status(404).json({ success: false, error: "not_found" });

    const { lifetime, weekly } = calcReportStats(doc.reports);
    const reportedByMe =
      userHeaderId &&
      Array.isArray(doc.reports) &&
      doc.reports.some((r) => String(r.user) === userHeaderId);

    // Use populated user's current name, fallback to stored author
    const displayAuthor = doc.createdBy?.name || doc.createdBy?.email || doc.author || "Anonymous";

    res.json({
      success: true,
      recipe: {
        ...doc,
        author: displayAuthor,
        reportsCount: lifetime,
        weeklyReports: weekly,
        reportedByMe,
      },
    });
  } catch (e) {
    // console.error("get_recipe_error:", e);
    res.status(500).json({ success: false, error: "get_failed" });
  }
});

/**
 * POST /api/recipes/validate-image
 * Validate image before recipe submission using Cloud Vision API
 * Checks for inappropriate content and food relevance
 */
router.post("/validate-image", protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        approved: true, // Allow recipes without images
        message: "No image provided - recipes without images are allowed"
      });
    }

    // Skip validation for very small images (likely placeholder or error)
    if (image.length < 1000) {
      return res.status(400).json({
        success: false,
        approved: false,
        message: "Image appears to be invalid or too small"
      });
    }

    // Check if Cloud Vision is configured
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      // If not configured, allow all images (fallback mode)
      console.warn("Cloud Vision not configured - skipping image moderation");
      return res.json({
        success: true,
        approved: true,
        message: "Image validation skipped (service not configured)",
        skipped: true
      });
    }

    // Analyze the image (includes background copyright check)
    const result = await analyzeImage(image, {
      userId: req.user?._id || req.user?.id || null
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        approved: false,
        message: result.message || "Image analysis failed"
      });
    }

    // DEBUG: Log what we're sending back
    console.log('[validate-image] Sending response:', {
      approved: result.approved,
      copyrightCheck: result.copyrightCheck,
      hasCopyrightCheck: !!result.copyrightCheck
    });

    res.json({
      success: true,
      approved: result.approved,
      message: result.message,
      details: {
        isInappropriate: result.isInappropriate,
        inappropriateFlags: result.inappropriateFlags,
        isFoodRelated: result.isFoodRelated,
        foodLabels: result.foodLabels,
        detectedLabels: result.allLabels
      },
      // Include copyright check info for frontend polling
      copyrightCheck: result.copyrightCheck || null
    });

  } catch (error) {
    console.error("Image validation error:", error);
    res.status(500).json({
      success: false,
      approved: false,
      message: "Failed to validate image. Please try again."
    });
  }
});

/**
 * POST /api/recipes/quick-safety-check
 * Quick safety check - only SafeSearch (faster, cheaper)
 */
router.post("/quick-safety-check", protect, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.json({ success: true, safe: true, message: "No image to check" });
    }

    // Check if Cloud Vision is configured
    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return res.json({
        success: true,
        safe: true,
        message: "Safety check skipped (service not configured)",
        skipped: true
      });
    }

    const result = await quickSafetyCheck(image);

    res.json({
      success: result.success,
      safe: result.safe,
      message: result.safe ? "Image passed safety check" : "Image flagged for inappropriate content",
      details: result.safeSearch
    });

  } catch (error) {
    console.error("Quick safety check error:", error);
    res.status(500).json({
      success: false,
      safe: false,
      message: "Safety check failed"
    });
  }
});

/**
 * GET /api/recipes/copyright-status/:uploadId
 * Check the status of a background copyright check
 * Returns: { status: 'pending' | 'processing' | 'complete' | 'error', result: copyrightAssessment }
 */
router.get("/copyright-status/:uploadId", protect, async (req, res) => {
  try {
    const { uploadId } = req.params;

    if (!uploadId || !uploadId.startsWith("cr_")) {
      return res.status(400).json({
        success: false,
        status: "invalid",
        message: "Invalid upload ID format"
      });
    }

    const checkStatus = await getCheckStatus(uploadId);

    if (checkStatus.status === "not_found") {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "Copyright check not found or expired"
      });
    }

    res.json({
      success: true,
      status: checkStatus.status,
      result: checkStatus.result,
      error: checkStatus.error,
      createdAt: checkStatus.createdAt,
      completedAt: checkStatus.completedAt
    });

  } catch (error) {
    console.error("Copyright status check error:", error);
    res.status(500).json({
      success: false,
      status: "error",
      message: "Failed to check copyright status"
    });
  }
});

/**
 * POST /api/recipes
 * Requires auth
 * Includes anti-spam validation
 */
router.post("/", protect, async (req, res) => {
  try {
    // Debug log for auth issues
    console.log('[Recipe Create] User authenticated:', {
      userId: req.user?._id || req.user?.id,
      email: req.user?.email,
      name: req.user?.name
    });

    const {
      title,
      image = "",
      author, // optional override
      prepTime = "",
      cookTime = "",
      difficulty = "Easy",
      description = "",
      servings = "",
      notes = "",
      ingredients = [],
      instructions = [],
      tags = [],
      allergens = [],
      copyrightUploadId = null, // From frontend copyright check
    } = req.body;

    if (!title) return res.status(400).json({ success: false, error: "title_required" });

    // Quick spam validation (hard reject for obvious issues)
    const quickError = quickSpamCheck({ title, ingredients, instructions });
    if (quickError) {
      return res.status(400).json({ success: false, error: quickError });
    }

    // Full spam analysis for soft-flagging
    const spamAnalysis = analyzeRecipeText({
      title, description, ingredients, instructions, notes
    });

    // Hard reject if spam score is very high
    if (spamAnalysis.isSpam) {
      console.log('[Recipe Create] Spam detected:', {
        userId: req.user?._id || req.user?.id,
        score: spamAnalysis.score,
        reasons: spamAnalysis.reasons
      });
      return res.status(400).json({
        success: false,
        error: "Recipe submission flagged as spam. Please ensure your recipe includes meaningful content.",
        details: spamAnalysis.reasons
      });
    }

    // ========== DUPLICATE RECIPE DETECTION ==========
    // Check if a similar recipe already exists in the database
    const cleanIngredientsArr = (Array.isArray(ingredients) ? ingredients : []).map(i => String(i).trim().toLowerCase()).filter(Boolean);
    const cleanInstructionsArr = (Array.isArray(instructions) ? instructions : []).map(i => String(i).trim().toLowerCase()).filter(Boolean);
    const ingredientsText = cleanIngredientsArr.join(' ');
    const instructionsText = cleanInstructionsArr.join(' ');

    // Search for recipes with same title (exact match)
    const exactTitleMatch = await Recipe.findOne({
      title: new RegExp(`^${escapeRegExp(title.trim())}$`, 'i'),
      state: { $ne: 'deleted' }
    });

    if (exactTitleMatch) {
      console.log('[Recipe Create] Duplicate title detected:', {
        userId: req.user?._id || req.user?.id,
        title,
        existingRecipeId: exactTitleMatch._id
      });
      return res.status(400).json({
        success: false,
        error: `A recipe with the title "${title}" already exists. Please use a different name or check if your recipe was already uploaded.`
      });
    }

    // Check for similar content (same ingredients + instructions)
    if (cleanIngredientsArr.length > 0 && cleanInstructionsArr.length > 0) {
      // Get recent recipes to compare against (limit to last 500 for performance)
      const recentRecipes = await Recipe.find(
        { state: { $ne: 'deleted' } },
        { ingredients: 1, instructions: 1, title: 1 }
      ).sort({ createdAt: -1 }).limit(500).lean();

      for (const existingRecipe of recentRecipes) {
        const existingIngredients = (existingRecipe.ingredients || []).map(i => String(i).trim().toLowerCase()).join(' ');
        const existingInstructions = (existingRecipe.instructions || []).map(i => String(i).trim().toLowerCase()).join(' ');

        // Check similarity
        const ingredientsSimilar = existingIngredients && ingredientsText &&
          (existingIngredients === ingredientsText || calculateSimilarity(existingIngredients, ingredientsText) > 0.85);
        const instructionsSimilar = existingInstructions && instructionsText &&
          (existingInstructions === instructionsText || calculateSimilarity(existingInstructions, instructionsText) > 0.85);

        if (ingredientsSimilar && instructionsSimilar) {
          console.log('[Recipe Create] Duplicate content detected:', {
            userId: req.user?._id || req.user?.id,
            newTitle: title,
            existingTitle: existingRecipe.title,
            existingRecipeId: existingRecipe._id
          });
          return res.status(400).json({
            success: false,
            error: `This recipe appears to be very similar to "${existingRecipe.title}". Please submit original content or modify your recipe significantly.`
          });
        }
      }
    }

    // Check copyright status if image is provided
    let copyrightCheckResult = null;
    let copyrightFlagged = false;

    if (image && copyrightUploadId) {
      // Try to get copyright check by uploadId
      const copyrightCheck = await getCheckByUploadId(copyrightUploadId);

      if (copyrightCheck) {
        if (copyrightCheck.status === "complete" && copyrightCheck.result) {
          copyrightCheckResult = copyrightCheck.result;
          // Flag if high or very_high risk
          if (["high", "very_high"].includes(copyrightCheck.result.riskLevel)) {
            copyrightFlagged = true;
            console.log('[Recipe Create] Copyright flagged:', {
              userId: req.user?._id || req.user?.id,
              riskLevel: copyrightCheck.result.riskLevel,
              matchCount: copyrightCheck.result.matchCount,
              matchedUrls: copyrightCheck.result.matchedUrls?.slice(0, 3)
            });
          }
        } else if (copyrightCheck.status === "pending" || copyrightCheck.status === "processing") {
          // Check not complete yet - flag for review to be safe
          copyrightFlagged = true;
          copyrightCheckResult = { riskLevel: "pending", note: "Check incomplete at submission time" };
          console.log('[Recipe Create] Copyright check incomplete, flagging for review:', {
            userId: req.user?._id || req.user?.id,
            status: copyrightCheck.status
          });
        }
      } else if (image) {
        // No copyright check found but image present - try by hash
        const base64Data = image.startsWith("data:image") ? image.split(",")[1] : image;
        const imageHash = generateImageHash(base64Data);
        const hashCheck = await getCheckByImageHash(imageHash);

        if (hashCheck?.status === "complete" && hashCheck.result) {
          copyrightCheckResult = hashCheck.result;
          if (["high", "very_high"].includes(hashCheck.result.riskLevel)) {
            copyrightFlagged = true;
          }
        }
      }
    }

    const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean);

    const cleanAllergens = (Array.isArray(allergens) ? allergens : String(allergens).split(","))
      .map((a) => String(a).trim().toLowerCase())
      .filter(Boolean);

    // Determine initial state based on spam AND copyright analysis
    const shouldFlagForSpam = spamAnalysis.shouldFlag;
    const shouldFlag = shouldFlagForSpam || copyrightFlagged;
    const initialState = shouldFlag ? "forReview" : "active";

    if (shouldFlag) {
      console.log('[Recipe Create] Flagged for review:', {
        userId: req.user?._id || req.user?.id,
        spamScore: spamAnalysis.score,
        spamReasons: spamAnalysis.reasons,
        copyrightFlagged,
        copyrightRiskLevel: copyrightCheckResult?.riskLevel
      });
    }

    const doc = await Recipe.create({
      title,
      image,
      author: author || (req.user?.name || req.user?.email || "anonymous"),
      prepTime,
      cookTime,
      difficulty,
      description,
      servings,
      notes,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: Array.isArray(instructions) ? instructions : [],
      tags: cleanTags,
      allergens: cleanAllergens,
      createdBy: req.user?._id || req.user?.id || null,
      state: initialState,
      isFlagged: shouldFlag,
      flaggedAt: shouldFlag ? new Date() : null,
      // Store copyright check result for admin review
      copyrightCheck: copyrightCheckResult ? {
        riskLevel: copyrightCheckResult.riskLevel,
        matchCount: copyrightCheckResult.matchCount || 0,
        stockPhotoDetected: copyrightCheckResult.stockPhotoDetected || false,
        matchedUrls: copyrightCheckResult.matchedUrls || [],
        recommendation: copyrightCheckResult.recommendation,
        checkedAt: new Date()
      } : null,
    });

    // Build response message
    let message;
    if (copyrightFlagged) {
      message = "Recipe submitted for review due to potential copyright concerns. It will be visible once approved.";
    } else if (shouldFlagForSpam) {
      message = "Recipe submitted for review. It will be visible once approved.";
    }

    res.status(201).json({
      success: true,
      recipe: doc,
      pendingReview: shouldFlag,
      copyrightFlagged,
      message
    });
  } catch (e) {
    console.error("create_recipe_error:", e);
    res.status(500).json({ success: false, error: "create_failed" });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a recipe - Creator or Admin can edit
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    // Check if user is the creator OR an admin
    const userId = String(req.user?._id || req.user?.id || "").trim();
    const recipeCreatorId = String(recipe.createdBy?._id || recipe.createdBy || "").trim();
    const isAdmin = req.user?.role === "admin";
    const isOwner = userId && recipeCreatorId && userId === recipeCreatorId;

    // console.log("Edit permission check:", { userId, recipeCreatorId, isOwner, isAdmin });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to edit this recipe"
      });
    }

    // Update allowed fields
    const {
      title,
      image,
      prepTime,
      cookTime,
      difficulty,
      description,
      servings,
      notes,
      ingredients,
      instructions,
      tags,
      allergens,
    } = req.body;

    if (title !== undefined) recipe.title = title;
    if (image !== undefined) recipe.image = image;
    if (prepTime !== undefined) recipe.prepTime = prepTime;
    if (cookTime !== undefined) recipe.cookTime = cookTime;
    if (difficulty !== undefined) recipe.difficulty = difficulty;
    if (description !== undefined) recipe.description = description;
    if (servings !== undefined) recipe.servings = servings;
    if (notes !== undefined) recipe.notes = notes;

    if (ingredients !== undefined) {
      recipe.ingredients = Array.isArray(ingredients) ? ingredients : [];
    }
    if (instructions !== undefined) {
      recipe.instructions = Array.isArray(instructions) ? instructions : [];
    }

    if (tags !== undefined) {
      const cleanTags = (Array.isArray(tags) ? tags : String(tags).split(","))
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean);
      recipe.tags = cleanTags;
    }

    if (allergens !== undefined) {
      const cleanAllergens = (Array.isArray(allergens) ? allergens : String(allergens).split(","))
        .map((a) => String(a).trim().toLowerCase())
        .filter(Boolean);
      recipe.allergens = cleanAllergens;
    }

    await recipe.save();

    res.json({ success: true, recipe });
  } catch (e) {
    // console.error("update_recipe_error:", e);
    res.status(500).json({ success: false, error: "update_failed" });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe - Creator or Admin can delete
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    // Check if user is the creator OR an admin
    const userId = String(req.user?._id || req.user?.id || "").trim();
    const recipeCreatorId = String(recipe.createdBy?._id || recipe.createdBy || "").trim();
    const isAdmin = req.user?.role === "admin";
    const isOwner = userId && recipeCreatorId && userId === recipeCreatorId;

    // console.log("Delete permission check:", { userId, recipeCreatorId, isOwner, isAdmin });

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this recipe"
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    const message = isAdmin && !isOwner
      ? "Recipe deleted by admin"
      : "Recipe deleted successfully";

    res.json({ success: true, message });
  } catch (e) {
    // console.error("delete_recipe_error:", e);
    res.status(500).json({ success: false, error: "delete_failed" });
  }
});

/**
 * POST /api/recipes/:id/report
 * Report a recipe for admin review (with detailed tracking)
 * Auto-flags recipe if: 5+ reports in past week OR 20+ lifetime reports
 */
router.post("/:id/report", protect, async (req, res) => {
  try {
    const { reason = 'other', description = '' } = req.body;

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (recipe.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'This recipe has already been removed'
      });
    }

    // Check if user already reported this recipe (any status)
    const existingReport = await RecipeReport.findOne({
      recipeId: req.params.id,
      reportedBy: req.user._id
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this recipe'
      });
    }

    // Create report
    await RecipeReport.create({
      recipeId: req.params.id,
      reportedBy: req.user._id,
      reason,
      description,
      status: 'pending'
    });

    // Check report thresholds: 5 reports/week OR 20 lifetime
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [lifetimeCount, weeklyCount] = await Promise.all([
      RecipeReport.countDocuments({ recipeId: req.params.id }),
      RecipeReport.countDocuments({ recipeId: req.params.id, createdAt: { $gte: weekAgo } })
    ]);

    // Auto-flag if thresholds met
    const shouldFlag = weeklyCount >= 5 || lifetimeCount >= 20;

    if (shouldFlag && !recipe.isFlagged) {
      recipe.isFlagged = true;
      recipe.flaggedAt = new Date();
      recipe.flaggedBy = req.user._id;
      await recipe.save();
    }

    res.json({
      success: true,
      message: 'Recipe reported successfully. Our admin team will review it.',
      flagged: shouldFlag
    });
  } catch (e) {
    // console.error('report_recipe_error:', e);
    res.status(500).json({
      success: false,
      message: 'Failed to report recipe. Please try again.'
    });
  }
});

module.exports = router;
