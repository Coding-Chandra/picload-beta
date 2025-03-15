const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse and destructure the incoming payload
    const { url, title, description, category } = JSON.parse(event.body);

    // Validate required fields
    if (!url || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: url, title, or category' }),
      };
    }

    // Insert into Supabase 'images' table and select the inserted ID
    const { data, error } = await supabase
      .from('images')
      .insert([{ url, title, description: description || '', category }])
      .select('id');

    if (error) throw error;

    // Return the inserted ID
    return {
      statusCode: 200,
      body: JSON.stringify({ id: data[0].id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
