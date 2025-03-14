// functions/
const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});
console.log('FaunaDB secret:', process.env.FAUNA_SECRET_KEY ? '[set]' : 'undefined');

exports.handler = async function(event, context) {
  console.log('Event body:', event.body);
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const data = JSON.parse(event.body);
    console.log('Parsed data:', data);
    const result = await client.query(
      q.Create(
        q.Collection('images'),
        { data: { /* ... */ } }
      )
    );
    console.log('Query result:', result);
    // ...
  } catch (error) {
    console.error('FaunaDB error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
