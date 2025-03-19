// functions/
const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  try {
    const result = await client.query(
      q.Map(
        q.Paginate(q.Documents(q.Collection('images'))),
        q.Lambda(x => q.Get(x))
      )
    );

    const images = result.data.map(item => item.data);
    
    return {
      statusCode: 200,
      body: JSON.stringify(images)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
