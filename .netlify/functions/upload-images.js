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
        'Access-Control-Allow-Origin': '*', // Adjust to your domain in production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // Handle POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { image, title, description, category } = JSON.parse(event.body);
    if (!image || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: image, title, or category' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(),
      tags: [category],
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.secure_url,
        id: result.public_id,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
