const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY,
  domain: 'db.fauna.com',
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const result = await client.query(
      q.Map(
        q.Paginate(q.Documents(q.Collection('images'))),
        q.Lambda('ref', q.Get(q.Var('ref')))
      )
    );

    const images = result.data.map(doc => ({
      id: doc.ref.id,
      url: doc.data.url,
      title: doc.data.title,
      description: doc.data.description,
      category: doc.data.category,
      date: doc.data.date,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(images),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
