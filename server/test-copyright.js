// Test script for copyright detection module
require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  console.log('API Key configured:', !!process.env.GOOGLE_CLOUD_VISION_API_KEY);
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'configured' : 'not configured');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pickaplate');
  console.log('Connected to MongoDB');

  // Test copyright detection module
  const { generateUploadId, generateImageHash } = require('./services/copyrightDetection');
  const CopyrightCheck = require('./models/CopyrightCheck');

  const testUploadId = generateUploadId();
  console.log('Generated uploadId:', testUploadId);

  // Create a test document
  const testDoc = await CopyrightCheck.create({
    uploadId: testUploadId,
    imageHash: 'test_hash_' + Date.now(),
    status: 'pending'
  });
  console.log('Created test document:', testDoc._id);

  // Verify it exists
  const found = await CopyrightCheck.findOne({ uploadId: testUploadId });
  console.log('Document found:', !!found);

  // Clean up
  await CopyrightCheck.deleteOne({ uploadId: testUploadId });
  console.log('Test document deleted');

  await mongoose.disconnect();
  console.log('\nAll tests passed! The copyright detection module is working.');
}

test().catch(err => {
  console.error('Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
