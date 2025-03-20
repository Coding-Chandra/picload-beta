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
    console.log('Received event body:', event.body);
    const { image, title, description, category } = JSON.parse(event.body);
    
    // Log input data for debugging
    console.log('Parsed input:', { title, description, category, imageLength: image ? image.length : 'MISSING' });

    if (!image || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: image, title, or category' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(image, {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(),
      tags: [category],
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
    }).catch((err) => {
      throw new Error(`Cloudinary upload failed: ${JSON.stringify(err)}`);
    });

    console.log('Upload result:', result);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.secure_url,
        id: result.public_id,
      }),
    };
  } catch (error) {
    console.error('Error in upload-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'No error message available',
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
