const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const result = await cloudinary.api.resources({
      resource_type: 'image',
      prefix: 'photo-gallery',
      max_results: 100, // Adjust as needed
      context: true, // Include custom metadata
      tags: true,
    });

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
      body: JSON.stringify(images),
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
