import React, {useEffect, useState} from "react";
import {Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CryptoJS from "crypto-js";
import {downloadBase64Pdf, uuidToUuidWithDashes} from "../lib/utils";
import {Button, Card} from "react-bootstrap";
import {apiDomain} from "../config/config";
import {downloadFromIPFS} from "../lib/ipfs";

/**
 * Component that downloads the document using one time link.
 * Uses the route parameters as variables to resolve which document to download, and download key from the DB
 * @param props
 * @param props.contract - smart contract instance
 * @param id - provided by the useParams. Link to the encrypted decryption key in the DB. DB ref: <db>/links/<ID> -> {<encrypted>}
 * @param uuid - provided by the useParams. Document key
 * @returns {JSX.Element}
 * @constructor
 */
const Downloading = (props) => {

  const contract = props.contract
  const { id, uuid } = useParams()
  const [status, setStatus] = useState("Loading")
  const navigate = useNavigate()

  // download the encrypted file from IPFS, and download the decryption key from DB.
  useEffect(() => { (async () => {
    try {

      const {path} = await contract.methods.documents("0x" + uuid).call();

      const encryptedBase64 = await downloadFromIPFS(path)

      const res2 = await axios.get(`${apiDomain}/links/${id}`)
      if (res2.data.error) {
        setStatus(res2.data.error)
        return
      }

      const key = res2.data.key
      const bytes = await CryptoJS.AES.decrypt(encryptedBase64, key)
      const originalBase64Text = bytes.toString(CryptoJS.enc.Utf8)
      downloadBase64Pdf(uuidToUuidWithDashes(uuid), originalBase64Text)
      navigate("/")

    }catch (e) {
      setStatus(e.message)
    }
  })()
  }, [])

  return (
    <Card className="text-center">
      <Card.Body>
        <Card.Title>
          {status}
        </Card.Title>
        <Button as={Link} to="/" >Home</Button>
      </Card.Body>
    </Card>
  )
}


export default Downloading;