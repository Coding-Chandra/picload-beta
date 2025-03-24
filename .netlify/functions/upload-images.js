const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { title, description, tags } = JSON.parse(event.body);

    if (!title || !tags) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields: title and tags' })
      };
    }

    // Generate a signature for the upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${Date.now()}`;
    const paramsToSign = {
      folder: 'picload',
      public_id: publicId,
      timestamp: timestamp,
      context: `title=${title}|description=${description || ''}|tags=${tags}`
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    // Return the signed upload parameters
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        params: {
          api_key: process.env.CLOUDINARY_API_KEY,
          timestamp: timestamp,
          signature: signature,
          folder: 'picload',
          public_id: publicId,
          context: `title=${title}|description=${description || ''}|tags=${tags}`
        }
      })
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
