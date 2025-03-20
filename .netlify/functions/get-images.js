const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

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
    });
    console.log('Cloudinary response:', result);

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
        stack: error.stack || 'No stack trace available',
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
