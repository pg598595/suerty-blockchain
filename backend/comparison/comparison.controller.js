const CryptoJS = require("crypto-js");
const {getDocumentPrivateData} = require("../documents/documents.model");

const client = require('@draftable/compare-api').client(process.env.COMPARISON_ID, process.env.COMPARISON_TOKEN);
const comparisons = client.comparisons;

// create comparison api url link
async function createUrl(doc1, doc2) {
  const comparison = await comparisons.create({
    left: {
      source: Buffer.from(Uint8Array.from(Buffer.from(doc1, 'base64'))),
      fileType: 'pdf',
    },
    right: {
      source: Buffer.from(Uint8Array.from(Buffer.from(doc2, 'base64'))),
      fileType: 'pdf',
    },
    expires: new Date(Date.now() + 1000 * 60 * 2),
  })

  console.log("Comparison created: %s", comparison);
  // Generate a signed viewer URL to access the private comparison. The expiry
  // time defaults to 30 minutes if the valid_until parameter is not provided.
  const viewerURL = comparisons.signedViewerURL(comparison.identifier);
  console.log("Viewer URL (expires in 2 minutes): %s", viewerURL);
  return viewerURL

}

/**
 * Create comparison url
 * @param req
 * @param req.body.doc1 - first document in base64
 * @param req.body.doc2 - second document in base64
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.compareTwoDocs = async function (req, res, next) {
  console.log(">>>> compareTwoDocs <<<<<<")
  if (!req.body.doc2) {
    return next('route')
  }
  const viewerURL = await createUrl(req.body.doc1, req.body.doc2)
  res.status(200).json({viewerURL: viewerURL})
}

exports.compareOneDoc = async function (req, res, next) {
  console.log(">>>> compareOneDoc <<<<<<")
  const doc = await getDocumentPrivateData(req.body.uuid)
  const docData = doc.data()
  const keyBytes = await CryptoJS.AES.decrypt(docData.key, process.env.SECRET);
  const key = keyBytes.toString(CryptoJS.enc.Utf8)
  const fileBytes = await CryptoJS.AES.decrypt(docData.encryptedFile, key);
  const fileBase64 = fileBytes.toString(CryptoJS.enc.Utf8)
  const viewerURL = await createUrl(req.body.doc1, fileBase64)
  res.status(200).json({viewerURL: viewerURL, key: key})
}