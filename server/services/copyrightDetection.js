// server/services/copyrightDetection.js
// Background copyright detection using Google Cloud Vision Web Detection

const crypto = require("crypto");
const CopyrightCheck = require("../models/CopyrightCheck");

// Get API key at runtime
function getApiKey() {
  return process.env.GOOGLE_CLOUD_VISION_API_KEY;
}

// Domain categorization for risk assessment
const STOCK_PHOTO_DOMAINS = [
  "shutterstock.com",
  "gettyimages.com",
  "istockphoto.com",
  "stock.adobe.com",
  "depositphotos.com",
  "dreamstime.com",
  "123rf.com",
  "alamy.com",
  "bigstockphoto.com",
  "stocksy.com",
  "pond5.com",
  "envato.com",
  "elements.envato.com"
];

const RECIPE_FOOD_DOMAINS = [
  "allrecipes.com",
  "foodnetwork.com",
  "epicurious.com",
  "seriouseats.com",
  "bonappetit.com",
  "delish.com",
  "tasty.co",
  "simplyrecipes.com",
  "food52.com",
  "cookinglight.com",
  "myrecipes.com",
  "tastingtable.com",
  "eatingwell.com",
  "thekitchn.com",
  "smittenkitchen.com",
  "sallysbakingaddiction.com",
  "kingarthurbaking.com",
  "budgetbytes.com",
  "minimalistbaker.com",
  "skinnytaste.com",
  "halfbakedharvest.com",
  "pinchofyum.com",
  "cookieandkate.com",
  "recipetineats.com",
  "yummly.com"
];

const USER_GENERATED_DOMAINS = [
  "pinterest.com",
  "reddit.com",
  "imgur.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tumblr.com",
  "flickr.com",
  "tiktok.com",
  "youtube.com",
  "medium.com",
  "wordpress.com",
  "blogspot.com"
];

/**
 * Generate a unique upload ID for tracking
 */
function generateUploadId() {
  return `cr_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * Generate a hash of the image for deduplication
 */
function generateImageHash(base64Data) {
  return crypto.createHash("sha256").update(base64Data).digest("hex").substring(0, 32);
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    // Remove 'www.' prefix if present
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if domain matches any in a list (including subdomains)
 */
function matchesDomainList(url, domainList) {
  const domain = extractDomain(url);
  if (!domain) return false;

  return domainList.some(d => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Call Google Cloud Vision API with Web Detection
 */
async function callWebDetectionAPI(imageBase64) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Vision API key not configured");
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: "WEB_DETECTION", maxResults: 20 }]
      }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status} - ${data.error?.message || "Unknown"}`);
  }

  if (data.responses?.[0]?.error) {
    throw new Error(data.responses[0].error.message);
  }

  return data.responses[0].webDetection || {};
}

/**
 * Assess copyright risk based on Web Detection results
 * @param {Object} webDetection - Raw Web Detection result from Vision API
 * @returns {Object} Risk assessment
 */
function assessCopyrightRisk(webDetection) {
  const {
    webEntities = [],
    fullMatchingImages = [],
    pagesWithMatchingImages = [],
    visuallySimilarImages = [],
    partialMatchingImages = []
  } = webDetection;

  // Collect all URLs where this exact image was found
  const allMatchUrls = [
    ...fullMatchingImages.map(img => img.url),
    ...pagesWithMatchingImages.map(page => page.url)
  ].filter(Boolean);

  const matchCount = allMatchUrls.length;

  // Categorize matches by domain type
  let stockPhotoMatches = [];
  let recipeSiteMatches = [];
  let userGeneratedMatches = [];
  let otherMatches = [];

  for (const url of allMatchUrls) {
    if (matchesDomainList(url, STOCK_PHOTO_DOMAINS)) {
      stockPhotoMatches.push(url);
    } else if (matchesDomainList(url, RECIPE_FOOD_DOMAINS)) {
      recipeSiteMatches.push(url);
    } else if (matchesDomainList(url, USER_GENERATED_DOMAINS)) {
      userGeneratedMatches.push(url);
    } else {
      otherMatches.push(url);
    }
  }

  // Determine risk level based on categorization
  let riskLevel = "low";
  let recommendation = "approve";

  if (stockPhotoMatches.length > 0) {
    // VERY_HIGH: Found on stock photo sites
    riskLevel = "very_high";
    recommendation = "flag_for_review";
  } else if (recipeSiteMatches.length > 0) {
    // HIGH: Found on recipe/food sites
    riskLevel = "high";
    recommendation = "flag_for_review";
  } else if (userGeneratedMatches.length > 0 && otherMatches.length === 0) {
    // MEDIUM: Found only on user-generated sites
    riskLevel = "medium";
    recommendation = "approve";
  } else if (otherMatches.length > 0) {
    // Could be copyrighted from other sources
    if (otherMatches.length >= 3) {
      riskLevel = "high";
      recommendation = "flag_for_review";
    } else {
      riskLevel = "medium";
      recommendation = "approve";
    }
  }
  // LOW: No fullMatchingImages or pagesWithMatchingImages (matchCount === 0)

  // Build top 5 matched URLs (prioritize higher-risk matches)
  const matchedUrls = [
    ...stockPhotoMatches,
    ...recipeSiteMatches,
    ...otherMatches,
    ...userGeneratedMatches
  ].slice(0, 5);

  return {
    riskLevel,
    matchCount,
    stockPhotoDetected: stockPhotoMatches.length > 0,
    matchedUrls,
    recommendation,
    // Include raw data for debugging
    webEntities: webEntities.slice(0, 10).map(e => ({
      entityId: e.entityId,
      description: e.description,
      score: e.score
    })),
    fullMatchingImages: fullMatchingImages.slice(0, 10).map(img => ({ url: img.url })),
    pagesWithMatchingImages: pagesWithMatchingImages.slice(0, 10).map(page => ({
      url: page.url,
      pageTitle: page.pageTitle
    })),
    visuallySimilarImages: visuallySimilarImages.slice(0, 5).map(img => ({ url: img.url })),
    // Breakdown for transparency
    breakdown: {
      stockPhotoMatches: stockPhotoMatches.length,
      recipeSiteMatches: recipeSiteMatches.length,
      userGeneratedMatches: userGeneratedMatches.length,
      otherMatches: otherMatches.length
    }
  };
}

/**
 * Start a background copyright check
 * Creates a pending record and triggers async processing
 * @param {string} imageBase64 - Base64 image data (without data URI prefix)
 * @param {string} userId - User ID (optional)
 * @returns {Object} { uploadId, imageHash }
 */
async function startBackgroundCheck(imageBase64, userId = null) {
  const imageHash = generateImageHash(imageBase64);
  const uploadId = generateUploadId();

  // Check if we already have a recent check for this exact image
  const existingCheck = await CopyrightCheck.findOne({
    imageHash,
    status: "complete",
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Within last 30 mins
  });

  if (existingCheck) {
    console.log(`[Copyright] Reusing existing check for hash ${imageHash.substring(0, 8)}...`);
    return {
      uploadId: existingCheck.uploadId,
      imageHash,
      reused: true
    };
  }

  // Create pending record
  await CopyrightCheck.create({
    uploadId,
    imageHash,
    userId,
    status: "pending"
  });

  // Trigger async processing (don't await)
  processBackgroundCheck(uploadId, imageBase64).catch(err => {
    console.error(`[Copyright] Background check failed for ${uploadId}:`, err.message);
  });

  console.log(`[Copyright] Started background check: ${uploadId}`);
  return { uploadId, imageHash, reused: false };
}

/**
 * Process the copyright check in the background
 * @param {string} uploadId - Upload ID to update
 * @param {string} imageBase64 - Base64 image data
 */
async function processBackgroundCheck(uploadId, imageBase64) {
  try {
    // Update status to processing
    await CopyrightCheck.updateOne(
      { uploadId },
      { status: "processing", startedAt: new Date() }
    );

    // Call Vision API
    const webDetection = await callWebDetectionAPI(imageBase64);

    // Assess risk
    const assessment = assessCopyrightRisk(webDetection);

    // Update with results
    await CopyrightCheck.updateOne(
      { uploadId },
      {
        status: "complete",
        completedAt: new Date(),
        result: assessment
      }
    );

    console.log(`[Copyright] Completed check ${uploadId}: ${assessment.riskLevel} risk, ${assessment.matchCount} matches`);
  } catch (error) {
    // Update with error
    await CopyrightCheck.updateOne(
      { uploadId },
      {
        status: "error",
        completedAt: new Date(),
        error: error.message
      }
    );
    throw error;
  }
}

/**
 * Get the status/result of a copyright check
 * @param {string} uploadId - Upload ID to check
 * @returns {Object} { status, result }
 */
async function getCheckStatus(uploadId) {
  const check = await CopyrightCheck.findOne({ uploadId }).lean();

  if (!check) {
    return { status: "not_found", result: null };
  }

  return {
    status: check.status,
    result: check.status === "complete" ? check.result : null,
    error: check.error,
    createdAt: check.createdAt,
    completedAt: check.completedAt
  };
}

/**
 * Get copyright check by image hash (for recipe submission)
 * @param {string} imageHash - Hash of the image
 * @returns {Object} Latest check result or null
 */
async function getCheckByImageHash(imageHash) {
  const check = await CopyrightCheck.findOne({
    imageHash,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
  }).sort({ createdAt: -1 }).lean();

  return check;
}

/**
 * Get copyright check by upload ID (for recipe submission)
 * @param {string} uploadId - Upload ID
 * @returns {Object} Check result or null
 */
async function getCheckByUploadId(uploadId) {
  return await CopyrightCheck.findOne({ uploadId }).lean();
}

module.exports = {
  generateUploadId,
  generateImageHash,
  assessCopyrightRisk,
  startBackgroundCheck,
  processBackgroundCheck,
  getCheckStatus,
  getCheckByImageHash,
  getCheckByUploadId,
  // Export for testing
  STOCK_PHOTO_DOMAINS,
  RECIPE_FOOD_DOMAINS,
  USER_GENERATED_DOMAINS
};
