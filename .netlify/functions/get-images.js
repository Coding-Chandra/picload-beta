const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  try {
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUD_NAME || 'MISSING',
      api_key: process.env.API_KEY ? '[REDACTED]' : 'MISSING',
      api_secret: process.env.API_SECRET ? '[REDACTED]' : 'MISSING',
    });

    const queryParams = event.queryStringParameters || {};
    const nextCursor = queryParams.next_cursor || null;

    console.log('Fetching resources with params:', {
      resource_type: 'image',
      type: 'upload',
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
      next_cursor: nextCursor,
    });

    const result = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload', // Explicitly fetch 'upload' type, which includes unsigned
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
      next_cursor: nextCursor,
    });

    console.log('Total resources found this page:', result.resources.length);
    console.log('Fetched public_ids:', result.resources.map(r => ({ public_id: r.public_id, type: r.type })));
    console.log('Next cursor:', result.next_cursor);

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
      body: JSON.stringify(images), // Return flat array instead of object
    };
  } catch (error) {
    console.error('Error fetching images:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      http_code: error.http_code,
      response: error.response ? JSON.stringify(error.response) : 'No response',
    });
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch images', 
        details: error.message || 'Unknown error',
        http_code: error.http_code || 'N/A',
      }),
    };
  }
};
