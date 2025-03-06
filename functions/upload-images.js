const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer(); // Middleware to handle file uploads

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { user } = context.clientContext;
  if (!user) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    const data = JSON.parse(event.body);
    const imageUrl = data.imageUrl; // Direct file URL instead of base64

    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
