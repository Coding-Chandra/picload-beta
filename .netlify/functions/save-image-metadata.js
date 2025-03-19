// functions/save-image-metadata.js
const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    
    const result = await client.query(
      q.Create(
        q.Collection('images'),
        {
          data: {
            url: data.url,
            title: data.title,
            description: data.description,
            category: data.category,
            date: new Date().toISOString()
          }
        }
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.ref.id })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
