const {db} = require('../firebase/firebase-config');
const collection = db.collection('links');

exports.addOneTimeLink = async (data) => {
  return await collection.add(data);
}

exports.getKeyFromOneTimeLink = async (id) => {
  const key = await collection.doc(id).get();
  await collection.doc(id).delete();
  return key
}