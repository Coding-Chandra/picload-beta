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

    // Fetch all images of all types in photo-gallery
    let allResources = [];
    
    // Fetch signed uploads
    const signedResult = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
      next_cursor: nextCursor,
    });
    allResources = allResources.concat(signedResult.resources);

    // Fetch unsigned uploads
    const unsignedResult = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'unsigned',
      prefix: 'photo-gallery',
      max_results: 100,
      context: true,
      tags: true,
      next_cursor: nextCursor,
    });
    allResources = allResources.concat(unsignedResult.resources);

    console.log('Total resources found:', allResources.length);
    console.log('Fetched public_ids with types:', allResources.map(r => ({ public_id: r.public_id, type: r.type })));

    const images = allResources.map((resource) => ({
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
        next_cursor: signedResult.next_cursor || unsignedResult.next_cursor || null, // Use whichever has more pages
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
