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
    console.log('Function invoked - HTTP Method:', event.httpMethod);
    
    // Check if the request is a POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    console.log('Request headers:', JSON.stringify(event.headers));
    
    // Check if the body exists
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No data provided' }),
      };
    }

    // Parse the JSON data from the request body
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Received data structure:', {
        hasTitle: !!data.title,
        hasDescription: !!data.description,
        hasTags: !!data.tags,
        hasImage: !!data.image,
        imageLength: data.image ? data.image.length : 0
      });
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON format in request body' }),
      };
    }

    // Validate required fields
    if (!data.image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: image' }),
      };
    }
    
    if (!data.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: title' }),
      };
    }
    
    if (!data.tags) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: tags' }),
      };
    }

    // Check if image is a valid data URL
    if (!data.image.startsWith('data:') || !data.image.includes(';base64,')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid image format: must be a data URL' }),
      };
    }

    // Process tags
    let tagArray = [];
    if (Array.isArray(data.tags)) {
      tagArray = data.tags;
    } else if (typeof data.tags === 'string') {
      tagArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    console.log('Processed tags:', tagArray);
    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary directly from the base64 data URL
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          data.image,
          {
            folder: 'picload',
            public_id: `${Date.now()}`,
            resource_type: 'image',
            context: {
              title: data.title,
              description: data.description || '',
              tags: tagArray.join(',')
            }
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload success');
              resolve(result);
            }
          }
        );
      });

      console.log('Upload complete, URL:', uploadResult.secure_url);

      // Return success response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
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
    } catch (cloudinaryError) {
      console.error('Detailed Cloudinary error:', cloudinaryError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Image upload failed', 
          details: cloudinaryError.message || 'Unknown Cloudinary error'
        }),
      };
    }
  } catch (error) {
    console.error('Unhandled error in upload-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message || 'Unknown error'
      }),
    };
  }
};
