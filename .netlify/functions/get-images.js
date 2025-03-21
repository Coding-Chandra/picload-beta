const cloudinary = require('cloudinary').v2;

// Log configuration to verify environment variables
const config = {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
};
console.log('Cloudinary config:', {
  cloud_name: config.cloud_name,
  api_key: config.api_key ? '[REDACTED]' : 'MISSING',
  api_secret: config.api_secret ? '[REDACTED]' : 'MISSING',
});
cloudinary.config(config);

exports.handler = async (event) => {
  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Handle GET request
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    console.log('Fetching images from Cloudinary...');
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload', // Added required 'type' parameter
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
    });

    console.log('Cloudinary response:', JSON.stringify(result, null, 2));

exports.handler = async () => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: 'photo-gallery',
      max_results: 100,
    });

    const images = result.resources.map((resource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      title: resource.context?.custom?.alt || resource.public_id,
      description: resource.context?.custom?.description || '',
      tags: resource.tags || (resource.context?.custom?.tags ? resource.context.custom.tags.split(',') : []),
      date: resource.context?.custom?.date || resource.created_at,
      downloads: resource.context?.custom?.downloads || 0,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images),
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch images', details: error.message }),
    };
  }
};
