const {db} = require('../firebase/firebase-config');

exports.addAdmin = async (address, uid) => {
  return await db.collection('admin').doc(address).set({userId: uid})
}

exports.getAdmin = async (address) => {
  const snap = await db.collection('admin').doc(address).get()
  return snap.exists;
}