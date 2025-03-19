const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { image, title, description, category } = JSON.parse(event.body);
    if (!image) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided' }) };
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'photo-gallery',
      public_id: title.replace(/\s+/g, '-').toLowerCase(),
      tags: category,
      context: `alt=${title}|description=${description || ''}`,
    });

    const metadataResponse = await fetch('https://picload.netlify.app/.netlify/functions/save-image-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: result.secure_url,
        title,
        description,
        category,
      }),
    });

    const metadata = await metadataResponse.json();
    if (!metadataResponse.ok) {
      throw new Error(metadata.error || 'Failed to save metadata');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: result.secure_url, id: metadata.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
