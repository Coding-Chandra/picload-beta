const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const imageData = data.image; // Get base64 image from frontend
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    // Upload directly from base64
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'photo-gallery',
      public_id: data.title.replace(/\s+/g, '-').toLowerCase(),
      tags: data.category,
      context: `alt=${data.title}|description=${data.description}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: result.secure_url,
        public_id: result.public_id
      })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
