const {create} = require("ipfs-http-client");
const axios = require("axios");
const {ipfsDomain} = require("../config/config");

const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

/**
 * Upload file to the ipfs network
 * @param encryptedFile - fi;e that needs to be stored
 * @returns {AddResult} - location of the added file (has base58 form in string format)
 */
exports.uploadToIPFS = async (encryptedFile) => {
  return await ipfs.add(encryptedFile) //{pin: true}
}

/**
 * Download file from ipfs network
 * @param path - location of the file to download
 * @returns {any} - file data
 */
exports.downloadFromIPFS = async (path) => {
  const res = await axios.get(`${ipfsDomain}/${path}`)
  return res.data
}