const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
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

    // Upload the image to Cloudinary with metadata stored in context
    const result = await cloudinary.uploader.upload(image, {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(), // Creates a clean, unique ID
      tags: [category], // Store category as a tag for easier filtering
      context: `alt=${title}|description=${description || ''}|category=${category}|date=${new Date().toISOString()}`,
    });

    // Return the Cloudinary URL and public ID to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        url: result.secure_url,
        id: result.public_id, // Use Cloudinary's public_id as the identifier
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
