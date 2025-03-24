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
    console.log('Upload function invoked');
    
    // Check method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Ensure body exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Request body is empty' }),
      };
    }

    // Parse JSON body
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Request data parsed successfully');
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate required fields
    if (!data.image) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing image data' }),
      };
    }

    if (!data.title) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing title' }),
      };
    }

    // Check image format
    if (!data.image.startsWith('data:image/')) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid image format - must be a data URL starting with data:image/' }),
      };
    }

    // Extract the base64 content from the dataURL (simple but effective way)
    const base64Data = data.image.split(',')[1];
    if (!base64Data) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Could not extract base64 data from image' }),
      };
    }

    // Estimate file size (base64 is ~33% larger than binary)
    const estimatedSizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    const estimatedSizeInMB = estimatedSizeInBytes / (1024 * 1024);
    
    console.log(`Estimated file size: ${estimatedSizeInMB.toFixed(2)} MB`);

    // Check size limits
    if (estimatedSizeInMB > 8) { // Setting a safety margin below Cloudinary's 10MB limit
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `File too large (${estimatedSizeInMB.toFixed(2)} MB). Please use a smaller image (under 8MB).` 
        }),
      };
    }

    // Process tags
    const tagArray = Array.isArray(data.tags) 
      ? data.tags 
      : (typeof data.tags === 'string' 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) 
        : []);

    console.log('Tags:', tagArray);
    console.log('Starting Cloudinary upload process...');

    // Handle Cloudinary upload with increased timeout
    try {
      const uploadOptions = {
        folder: 'picload',
        public_id: `${Date.now()}`,
        resource_type: 'image',
        timeout: 60000, // 60-second timeout for large uploads
        context: {
          title: data.title,
          description: data.description || '',
          tags: tagArray.join(',')
        }
      };
      
      console.log('Upload options:', uploadOptions);
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          data.image,
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', JSON.stringify(error));
              reject(error);
            } else {
              console.log('Cloudinary upload successful');
              resolve(result);
            }
          }
        );
      });

      console.log('Upload result:', JSON.stringify({ 
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height 
      }));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            title: data.title,
            description: data.description || '',
            tags: tagArray
          }
        }),
      };
    } catch (cloudinaryError) {
      console.error('Cloudinary error details:', cloudinaryError);
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Cloudinary upload failed', 
          details: cloudinaryError.message || 'Unknown error during upload',
          code: cloudinaryError.http_code || cloudinaryError.code || 'unknown'
        }),
      };
    }
  } catch (generalError) {
    console.error('General function error:', generalError);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Server error',
        message: generalError.message || 'An unknown error occurred',
        stack: process.env.NODE_ENV === 'development' ? generalError.stack : undefined
      }),
    };
  }
};
