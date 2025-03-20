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
  console.log('Function invoked with method:', event.httpMethod);

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
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
    console.log('Invalid method detected');
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    console.log('Raw event body:', event.body);
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse event body:', parseError);
      throw new Error(`Body parsing failed: ${parseError.message}`);
    }

    const { image, title, description, category } = parsedBody;
    console.log('Parsed body:', {
      title,
      description,
      category,
      imagePreview: image ? `${image.slice(0, 50)}... (length: ${image.length})` : 'MISSING',
    });

    if (!image || !title || !category) {
      console.log('Missing required fields');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: image, title, or category' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Validate image format (basic check for base64)
    if (!image.startsWith('data:image/')) {
      console.log('Invalid image format detected');
      throw new Error('Image must be a valid base64 string starting with "data:image/"');
    }

    console.log('Attempting Cloudinary upload...');
    const uploadOptions = {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(),
      tags: [category],
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
    };
    console.log('Upload options:', uploadOptions);

    const result = await cloudinary.uploader.upload(image, uploadOptions).catch((err) => {
      console.error('Cloudinary upload error:', err);
      throw new Error(`Cloudinary upload failed: ${JSON.stringify(err)}`);
    });

    console.log('Upload successful, result:', result);

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
