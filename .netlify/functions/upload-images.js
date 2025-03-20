const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  console.log('Function invoked:', { method: event.httpMethod });

  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { title, description, category } = JSON.parse(event.body);
    console.log('Parsed data:', { title, description, category });

    if (!title || !category) {
      console.log('Missing required fields');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title or category' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const publicId = title.replace(/\s+/g, '-').toLowerCase();
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: 'photo-gallery',
      public_id: publicId,
      tags: category,
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
      timestamp: timestamp,
    };

    console.log('Generating signature with params:', paramsToSign);
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.API_SECRET);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        timestamp,
        apiKey: process.env.API_KEY,
        cloudName: process.env.CLOUD_NAME,
        folder: 'photo-gallery',
        publicId: publicId,
        tags: [category],
        context: paramsToSign.context,
      }),
    };
  } catch (error) {
    console.error('Error in upload-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'No error message available',
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
