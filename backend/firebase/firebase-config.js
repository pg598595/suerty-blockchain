const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccount.json');
// initialize firebase with admin credentials

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore()
module.exports = {admin, db};
