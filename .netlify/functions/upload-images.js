const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { image, title, description, tags } = body;

    if (!image || !title || !tags) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: image, title, or tags' }),
      };
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'photo-gallery',
      public_id: `${title}-${Date.now()}`,
      context: {
        custom: {
          alt: title,
          description: description || '',
          tags: tags.join(','),
          date: new Date().toISOString(),
          downloads: '0',
        },
      },
      tags: tags,
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        id: result.public_id,
        url: result.secure_url,
        title,
        description,
        tags,
        date: result.created_at,
        downloads: 0,
      }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to upload image', details: error.message }),
    };
  }
};
