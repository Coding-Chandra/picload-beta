const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event) => {
  try {
    // Log the event for debugging
    console.log('Event:', event);

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
        body: JSON.stringify({ error: 'No body provided' }),
      };
    }

    // Parse the multipart form data
    const { fields, files } = await parseMultipartForm(event);
    console.log('Parsed fields:', fields);
    console.log('Parsed files:', files);

    const file = files.file; // Assuming the file input name is 'file'
    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file uploaded' }),
      };
    }

    // Check file size (Netlify limit: 6MB)
    const maxSize = 6 * 1024 * 1024; // 6MB in bytes
    if (file.content.length > maxSize) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File size exceeds 6MB limit' }),
      };
    }

    // Extract metadata from fields
    const { title, description, tags } = fields;

    // Upload the file to Supabase storage
    const fileName = `public/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file.content, {
        contentType: file.type,
      });

    if (error) {
      console.error('Storage error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL of the uploaded file
    const { publicURL, error: urlError } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('URL error:', urlError);
      throw new Error(`Failed to get public URL: ${urlError.message}`);
    }

    // Save metadata to Supabase database
    const { data: metadata, error: dbError } = await supabase
      .from('images')
      .insert({
        url: publicURL,
        title: title || 'Untitled',
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        date: new Date().toISOString(),
        downloads: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save metadata: ${dbError.message}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image uploaded successfully', data: metadata }),
    };
  } catch (error) {
    console.error('Error in upload-images:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Helper function to parse multipart form data
async function parseMultipartForm(event) {
  const Busboy = require('busboy');
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers });
    const result = { fields: {}, files: {} };

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        result.files[fieldname] = {
          name: filename,
          content: Buffer.concat(chunks),
          type: mimetype,
        };
      });
    });

    busboy.on('field', (fieldname, value) => {
      result.fields[fieldname] = value;
    });

    busboy.on('finish', () => resolve(result));
    busboy.on('error', (error) => reject(error));

    busboy.write(Buffer.from(event.body, 'base64'));
    busboy.end();
  });
}
