const {pdfjs} = require("react-pdf/dist/umd/entry.webpack");
const {collection, query, where, limit, getDocs, addDoc, updateDoc} = require("firebase/firestore");
const {db} = require("./firebase");

/**
 * Formats the uuid string, adds the "–" (dash) every 8 letters
 * example: 1234567812345678123456781234567812345678 -> 12345678-12345678-12345678-12345678-12345678
 *
 * @param uuid - 40 characters string of letters [0-9A-F]
 * @returns {*} - formated string
 */
exports.uuidToUuidWithDashes = (uuid) => {
  return uuid.replace(/([0-z]{8})([0-z]{8})([0-z]{8})([0-z]{8})([0-z]{8})/,"$1-$2-$3-$4-$5");
}

/**
 * Removes dashes from the string
 * example: 12345678-12345678-12345678-12345678-12345678 -> 1234567812345678123456781234567812345678
 * @param uuid - 44 characters string of letters [0-9A-F] + "-"
 * @returns {*} - formated string
 */
exports.uuidRemoveDashes = (uuid) => {
  return uuid.replace(/-/g, "");
}

/**
 * Signs the message using the selected account
 * @param cid - message to sign
 * @param web3 - web3 instance that is currently in use
 * @param account - wallet account
 * @returns {Promise<string>}
 */
exports.getKeyFromOriginalCid = async (cid, web3, account) => {
  // if (window.ethereum || window.web3) {
  //   return await web3.eth.personal.sign(cid, account)
  // } else {
  let prefix = "\x19Ethereum Signed Message:\n" + cid.length
  let msgHash1 = web3.utils.sha3(prefix+cid)
  return await web3.eth.sign(msgHash1, account)
  // }
}

/**
 * Returns the address of the signer
 * @param cid - original message that was signed
 * @param web3 - web3 instance that is currently in use
 * @param key - signed message
 * @returns {Promise<string>} - account address of the message signer
 */
exports.getAddressFromCidAndKey = async (cid, web3, key) => {
  // if (window.ethereum || window.web3) {
  //   return await web3.eth.personal.ecRecover(cid, key);
  // } else {
  return web3.eth.accounts.recover(cid, key);
  // }
}

/**
 * Finds the document uuid (example: 12345678-12345678-12345678-12345678-12345678) in the pdf text
 * @param data - pdf file in the array Buffer form
 * @returns {Promise<string|undefined>} - undefined if text does not contain uuid, uuid string if one was found
 */
exports.findUUIDInText = async (data) => {
  try {
    const loadingTask = pdfjs.getDocument(data);
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const textArr = await page.getTextContent()
    const text = textArr.items.map(function (s) { return s.str; }).join('')
    const uuidReg =  text.match(/[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}/i)
    return uuidReg ? uuidReg.toString() : undefined
  }catch (e) {
    alert(e.message)
    return undefined
  }
}

/**
 * automatically download the pdf file
 * @param fileName - file name of the downloaded file
 * @param base64Text - base64 string data of the file
 */
exports.downloadBase64Pdf = (fileName, base64Text) => {
  const button = document.createElement('a')
  button.role = "button"
  button.download = fileName + ".pdf"
  button.href = "data:application/pdf;base64," + base64Text
  document.body.appendChild(button)
  button.click()
  button.remove()
}

/**
 * Check if the request for the DB file access exists in the DB.
 * If not create one, by reference <db>/requests/<newDocId>
 * If it exists check if it's still active
 * If not active, make it active
 * If it's active do nothing
 * @param email - email of the requester
 * @param uuid - uuid document key of the requested document
 * @param owner - account adderss of the document uploader
 * @returns {Promise<void>}
 */
exports.requestPermission = async (email, uuid, owner) => {
  const ref = collection(db, "requests")
  const q = query(
    ref,
    where("userEmail", "==", email),
    where("docId", "==", uuid),
    limit(1)
  )
  try {
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      await addDoc(ref, {
        userEmail: email,
        docId: uuid,
        owner: owner,
        active: true
      })
      return
    }
    snapshot.forEach((doc) => {
      if (doc.data().permit) return
      updateDoc(doc.ref, {active: true})
    })
  } catch (e) {
    alert(e.message)
  }
}