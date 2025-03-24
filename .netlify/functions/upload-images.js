const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

exports.handler = async (event) => {
  try {
    // Check if the request is a POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Check if the body exists
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No data provided' }),
      };
    }

    // Parse the JSON data from the request body
    const data = JSON.parse(event.body);
    console.log('Received data:', { 
      title: data.title, 
      description: data.description?.substring(0, 20) + '...',
      tags: data.tags,
      imageProvided: !!data.image
    });

    // Validate required fields
    if (!data.image || !data.title || !data.tags) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: image, title, or tags' }),
      };
    }

    // Process tags (handle both array and comma-separated string)
    let tagArray = [];
    if (Array.isArray(data.tags)) {
      tagArray = data.tags;
    } else if (typeof data.tags === 'string') {
      tagArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Upload to Cloudinary directly from the base64 data URL
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        data.image, // The base64 data URL from the frontend
        {
          folder: 'picload', // Optional: organize images in a folder
          public_id: `${Date.now()}`, // Optional: custom public_id
          resource_type: 'image',
          // Add metadata as context
          context: {
            title: data.title,
            description: data.description || '',
            tags: tagArray.join(',')
          }
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    console.log('Cloudinary upload result:', uploadResult);

    // Return success response with the Cloudinary data
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        data: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          title: data.title,
          description: data.description || '',
          tags: tagArray,
          created_at: new Date().toISOString()
        }
      }),
    };
  } catch (error) {
    console.error('Error in upload-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
