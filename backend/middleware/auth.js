const { admin } = require('../firebase/firebase-config');

/**
 * Decrypt the authentication token
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
module.exports = async (req, res, next) => {
  if(!req.headers.authorization) return next();
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (decodeValue) {
      req.user = decodeValue;
      return next();
    }
  } catch (e) {
    return res.status(500).json({ message: 'Internal Error' });
  }
};