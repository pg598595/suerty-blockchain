const documentsModel = require('./documents.model')
const CryptoJS = require('crypto-js')
const contractData = require("../smartContract/DocumentsHashStorage.json")
const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.PROVIDER_URL)
);

// check if the owner has permission to add document
exports.checkOwner = async function (req, res, next) {
  try {
    const address = web3.eth.accounts.recover(req.body.originalCid, req.body.key);
    const contract = new web3.eth.Contract(contractData.abi, contractData.networks[process.env.NETWORK].address);

    if (address !== req.body.owner) {
      return res.status(401).json({ error: "sign is different to account" })
    }
    if (!await contract.methods.permissions(req.body.owner).call()) {
      return res.status(401).json({ error: "address does not belong to owner" })
    }

    next()
  } catch (e) {
    next(e)
  }
}

/**
 * Add document to the firebase
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.addDocument = async function (req, res, next) {
  const key = await CryptoJS.AES.encrypt(req.body.key, process.env.SECRET).toString();
  const data = {
    originalCid: req.body.originalCid,
    encryptedFileCid: req.body.encryptedFileCid,
    encryptedFile: req.body.encryptedFile,
    owner: req.body.owner,
  }

  const privateData = {
    key: key,
    fileName: req.body.fileName,
  }

  try {
    await documentsModel.addDocument(req.params.uuid, data, privateData)
  } catch (e) {
    return next(e)
  }
  res.status(200).json({})
}

exports.getKey = async function (req, res, next) {
  if (!req.user) {
    res.status(403).json({error: "permission denied"})
  }
  const docPublic = await documentsModel.getDocument(req.params.uuid)
  const permit = await documentsModel.getPermit(docPublic.data().owner, req.user.email, req.params.uuid)

  if (!permit.exists) {
    res.status(403).json({error: "permission denied"})
  }

  let key;
  try {
    const doc = await documentsModel.getDocumentPrivateData(req.params.uuid)
    const keyBytes = await CryptoJS.AES.decrypt(doc.data().key, process.env.SECRET);
    key = keyBytes.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    console.log(e.message)
    return next(e)
  }
  res.status(200).json({key: key})
}