const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const nextCursor = queryParams.next_cursor || null;

    const result = await cloudinary.api.resources({
      resource_type: 'image',
      prefix: 'photo-gallery', // No 'type' filter to include all upload types
      max_results: 100,
      context: true,
      tags: true,
      next_cursor: nextCursor,
    });

    console.log('Total resources found:', result.resources.length);
    console.log('Fetched public_ids:', result.resources.map(r => ({ public_id: r.public_id, type: r.type }))); // Debug with type

    const images = result.resources.map((resource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      title: resource.context?.custom?.alt || resource.public_id.split('/').pop(),
      description: resource.context?.custom?.description || '',
      tags: resource.tags && resource.tags.length > 0 
        ? resource.tags 
        : (resource.context?.custom?.tags ? resource.context.custom.tags.split(',') : []),
      date: resource.context?.custom?.date || resource.created_at,
      downloads: parseInt(resource.context?.custom?.downloads) || 0,
    }));

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        images,
        next_cursor: result.next_cursor || null,
      }),
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch images', details: error.message }),
    };
  }
};
