const cloudinary = require('cloudinary').v2;

// Log configuration immediately
const config = {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
};
console.log('Cloudinary config:', {
  cloud_name: config.cloud_name || 'MISSING',
  api_key: config.api_key ? '[REDACTED]' : 'MISSING',
  api_secret: config.api_secret ? '[REDACTED]' : 'MISSING',
});
cloudinary.config(config);

exports.handler = async (event) => {
  console.log('Function invoked:', { method: event.httpMethod, bodyLength: event.body ? event.body.length : 'NO BODY' });

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('Returning OPTIONS response');
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

  // Enforce POST method
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Check if body exists
    if (!event.body) {
      console.log('No body provided');
      throw new Error('Request body is empty');
    }

    // Parse body
    console.log('Raw body preview:', event.body.slice(0, 100) + '...');
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Body parsing failed:', parseError);
      throw new Error(`Invalid JSON: ${parseError.message}`);
    }

    const { image, title, description, category } = data;
    console.log('Parsed data:', {
      title: title || 'MISSING',
      description: description || 'NONE',
      category: category || 'MISSING',
      imagePreview: image ? `${image.slice(0, 50)}... (length: ${image.length})` : 'MISSING',
    });

    // Validate required fields
    if (!image || !title || !category) {
      console.log('Validation failed: missing fields');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: image, title, or category' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Validate base64 format
    const base64Regex = /^data:image\/[a-z]+;base64,/;
    if (!base64Regex.test(image)) {
      console.log('Invalid base64 format');
      throw new Error('Image must be a valid base64 string (e.g., "data:image/jpeg;base64,...")');
    }

    // Prepare and log upload options
    const uploadOptions = {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(),
      tags: [category],
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
    };
    console.log('Upload options:', uploadOptions);

    // Test Cloudinary connectivity with a simple call first
    console.log('Testing Cloudinary API...');
    await cloudinary.api.root_folders().catch((err) => {
      console.error('Cloudinary API test failed:', err);
      throw new Error(`Cloudinary API connectivity test failed: ${JSON.stringify(err)}`);
    });
    console.log('Cloudinary API test succeeded');

    // Perform upload
    console.log('Starting Cloudinary upload...');
    const result = await cloudinary.uploader.upload(image, uploadOptions).catch((err) => {
      console.error('Upload failed:', err);
      throw new Error(`Cloudinary upload error: ${JSON.stringify(err)}`);
    });

    console.log('Upload result:', {
      url: result.secure_url,
      id: result.public_id,
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
    console.error('Full error in upload-images:', error);
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
