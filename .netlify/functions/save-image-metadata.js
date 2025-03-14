const { Client, query: q } = require('faunadb');

// Initialize FaunaDB client with explicit US endpoint
const client = new Client({
  secret: process.env.FAUNA_SECRET_KEY,
  domain: 'db.fauna.com', // US region endpoint for PicDB
  scheme: 'https',
  port: 443,
});

exports.handler = async (event) => {
  // Restrict to POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse body directly (faster than separate const)
    const { url, title, description, category } = JSON.parse(event.body);

    // Minimal validation
    if (!url || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: url, title, or category' }),
      };
    }

    // Create document in FaunaDB
    const result = await client.query(
      q.Create(q.Collection('images'), {
        data: {
          url,
          title,
          description: description || '', // Default to empty string if undefined
          category,
          date: q.Now(), // Use FaunaDB's native timestamp for speed
        },
      })
    );

    // Return only the ID (lean response)
    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.ref.id }),
    };
  } catch (error) {
    // Enhanced error logging without console.error for faster execution
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
