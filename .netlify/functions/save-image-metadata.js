const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY,
  domain: 'db.fauna.com',
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { url, title, description, category } = JSON.parse(event.body);
    if (!url || !title || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: url, title, or category' }),
      };
    }

    const result = await client.query(
      q.Create(
        q.Collection('images'),
        {
          data: {
            url,
            title,
            description: description || '',
            category,
            date: q.Now(),
          },
        }
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.ref.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
