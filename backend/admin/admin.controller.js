const adminModel = require('./admin.model')
const contractData = require("../smartContract/DocumentsHashStorage.json")
const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.PROVIDER_URL)
);

/**
 *
 * @param req.body.signedUid -signed uid with the req.body.address account
 * @param req.body.address - address of the signer
 * @param req.body.uid - id of the user
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.addAdmin = async function (req, res, next) {
  const uid = req.body.uid;
  const signedUid = req.body.signedUid;
  const address = req.body.address;
  const address2 = web3.eth.accounts.recover(uid, signedUid);
  const contract = new web3.eth.Contract(contractData.abi, contractData.networks[process.env.NETWORK].address);

  // check if the address is the same as signer
  if (address !== address2) {
    return res.status(401).json({ error: "sign is different to account" })
  }

  // check if the address has permission on the blockchain
  if (!await contract.methods.permissions(address).call()) {
    return res.status(401).json({ error: "address does not belong to owner" })
  }

  try {
    await adminModel.addAdmin(address, uid)
  } catch (e) {
    return next(e)
  }
  res.status(200).json({success: true})
}
