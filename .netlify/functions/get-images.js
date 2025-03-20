const cloudinary = require('cloudinary').v2;

// Log configuration to verify environment variables
const config = {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
};
console.log('Cloudinary config:', {
  cloud_name: config.cloud_name,
  api_key: config.api_key ? '[REDACTED]' : 'MISSING', // Hide API key but confirm presence
  api_secret: config.api_secret ? '[REDACTED]' : 'MISSING', // Hide secret but confirm presence
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
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
    }).catch((err) => {
      throw new Error(`Cloudinary API call failed: ${JSON.stringify(err)}`);
    });

    console.log('Cloudinary response:', JSON.stringify(result, null, 2));

    const images = result.resources.map((resource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      title: resource.context?.custom?.alt || resource.public_id,
      description: resource.context?.custom?.description || '',
      category: resource.context?.custom?.category || resource.tags[0] || '',
      date: resource.context?.custom?.date || resource.created_at,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images),
    };
  } catch (error) {
    console.error('Error in get-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'No error message available',
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)), // Capture all properties
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
