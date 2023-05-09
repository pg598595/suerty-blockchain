const linksModel = require('./links.model')
const CryptoJS = require("crypto-js");

/**
 * Encrypt the decryption key and save it in the DB
 * @param req.body.key - decryption key of the document
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.createOneTimeLink = async function (req, res, next) {
  console.log(">>>> create one time link <<<<<<")
  const key = await CryptoJS.AES.encrypt(req.body.key, process.env.SECRET2).toString();

  let ref;
  try {
    ref = await linksModel.addOneTimeLink({key: key})
  } catch (e) {
    return next(e)
  }

  res.status(200).json({path: `/${req.body.uuid}/${ref.id}`})
}

/**
 * Decrypt the ekey from the DB, and delete it in the DB
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.useOneTimeLink = async function (req, res, next) {
  const id = req.params.id
  let encryptedKeyDoc;

  try {
    encryptedKeyDoc = await linksModel.getKeyFromOneTimeLink(id)
  } catch (e) {
    return next(e)
  }
  if(!encryptedKeyDoc.exists) {
    return res.status(404).json({error: "Already used"})
  }

  const encryptedKey = encryptedKeyDoc.data().key
  const bytesKey = CryptoJS.AES.decrypt(encryptedKey, process.env.SECRET2);
  const key = bytesKey.toString(CryptoJS.enc.Utf8);

  console.log(key)
  res.status(200).json({key: key})
}
