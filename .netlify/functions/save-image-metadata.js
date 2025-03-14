const { Client, query: q } = require('faunadb');

// Initialize FaunaDB client with minimal config
const client = new Client({
  secret: process.env.FAUNA_SECRET_KEY,
  domain: 'db.fauna.com', // Explicit US endpoint for PicDB
  scheme: 'https',
  port: 443,
});
console.log('FAUNA_SECRET_KEY:', process.env.FAUNA_SECRET_KEY ? '[set]' : 'undefined');

exports.handler = async (event) => {
  // Fast method check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Parse body once, directly destructure needed fields
    const { url, title, description, category } = JSON.parse(event.body);

    // Validate required fields inline
    if (!url || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: url, title, or category' }),
      };
    }

    // Single FaunaDB query with optimized structure
    const result = await client.query(
      q.Create(
        q.Collection('images'),
        {
          data: {
            url,
            title,
            description: description || '', // Default to empty string if missing
            category,
            date: q.Now(), // Use FaunaDB's built-in timestamp
          },
        }
      )
    );

    // Return only the ID for minimal payload
    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.ref.id }),
    };
  } catch (error) {
    // Simplified error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
