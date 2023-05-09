const {db} = require('../firebase/firebase-config');
const collection = db.collection('documents');

exports.addDocument = async (id, data, privateData) => {
  await collection.doc(id).set(data);
  return await collection.doc(`${id}/private/data`).set(privateData);
}

exports.getDocument = async (id) => {
  return await collection.doc(id).get();
}

exports.getPermit = async (ownerAddress, userEmail, docId) => {
  return await db.collection('permit').doc(`${ownerAddress}/user/${userEmail}/doc/${docId}`).get();
}

exports.getDocumentPrivateData = async (id) => {
  return await collection.doc(`${id}/private/data`).get();
}
