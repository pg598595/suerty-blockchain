import React, {useEffect, useState} from "react";
import "../App.css";
import Upload from "../components/Upload";
import {Alert, Button, Card, Col, Container, FormControl, InputGroup, Row} from "react-bootstrap";
import {of} from "ipfs-only-hash";
import pdf2base64 from 'pdf-to-base64';
import {Document, Page} from "react-pdf/dist/umd/entry.webpack";

import CryptoJS from "crypto-js"
import axios from 'axios';

import ListFiles from "../components/ListFiles";
import {
  findUUIDInText,
  getKeyFromOriginalCid,
  uuidRemoveDashes,
  uuidToUuidWithDashes
} from "../lib/utils";
import {downloadFromIPFS, uploadToIPFS} from "../lib/ipfs";
import {doc, getDoc} from "firebase/firestore";
import {db} from "../lib/firebase";
import {UserAuth} from "../contexts/AuthContext";
import {useNavigate} from "react-router-dom";
import {apiDomain} from "../config/config";

/**
 * Page for admin document upload.
 * @param props
 * @param props.contract - contract instance
 * @param props.web3 - current web3 provider
 * @param props.account - wallet account instance
 * @returns {JSX.Element}
 * @constructor
 */
const Landing = (props) => {
  const { loggedInUser } = UserAuth();
  const navigate = useNavigate()

  const web3 = props.web3
  const account = props.account
  const contract = props.contract
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)

  const [docsList, setDocsList] = useState([])

  const [uploadingFile, setUploadingFile] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState(false)

  const [buffer, setBuffer] = useState(null)
  const [error, setError] = useState(null)

  const [submitted, setSubmitted] = useState(false)
  const [key, setKey] = useState("")
  const [link, setLink] = useState("")
  const [selectedUuid, setSelectedUuid] = useState("")

  const [pdfWrapper, setPdfWrapper] = useState(null)
  const [pdfWrapperWidth, setPdfWrapperWidth] = useState(0)

  const [fileName, setFileName] = useState("")

  // set filename for the file to download
  useEffect(() => {
    if (!selectedUuid) return
    setFileName(uuidToUuidWithDashes(selectedUuid))
  }, [selectedUuid])

  // check if the account is permitted to upload documents
  const checkAdmin = async () => {
    const isPermitted = await contract.methods.permissions(account).call();
    if (!isPermitted) {
      navigate("/")
      return
    }
    const acc = await getDoc(doc(db, "admin", props.account))
    if (acc.exists()) {return}
    alert("New owner account first login, please sign to authenticate")
    //map the user to the wallet account on the backend for AdminRequests page
    const data = {
      uid: loggedInUser.uid,
      signedUid: await getKeyFromOriginalCid(loggedInUser.uid, web3, account),
      address: account
    }
    await axios.post(`${apiDomain}/admin`, data);

  }

  // check if the user is admin at the page load
  useEffect(() => {
    if (!account) return
    if (!loggedInUser) return
    checkAdmin()
  }, [])

  // set the pdf viewer width to his cotainer width
  useEffect(() => {
    if (!pdfWrapper) return
    setPdfWrapperWidth(pdfWrapper.getBoundingClientRect().width)
  }, [pdfWrapper])

  // get the owners uploaded documents
  useEffect(() => {
    (async () => {
      // noinspection JSValidateTypes
      const size = await contract.methods.ownerToUuidsSize(account).call();
      for (let i = 0; i < size; i++) {
        const uuid = await getUUIDByIterator(i)
        addUUIDToList(uuid)
      }
    })();
  }, []);

  // returns the owner document by the number (0 - if it's the first document uploaded by the account, 1 - for secont ...)
  const getUUIDByIterator = async (i) => {
    // noinspection JSValidateTypes
    return web3.utils.toBN(await contract.methods.ownerToUuids(account, i).call()).toString("hex").toUpperCase()
  }

  // add the document to the list of uploaded documents, if the user is authenticated download the document names from DB
  const addUUIDToList = async (uuid) => {
    let docName;
    if (loggedInUser) {
      try {
        const docSnap = await getDoc(doc(db, "documents", uuid, "private", "data"))
        docName = docSnap.exists() ? docSnap.data().fileName || "No name" : "No name"
      } catch (e) {
        docName = "Hidden"
      }
    } else {
      docName = "Hidden"
    }

    setDocsList(docsList => [{uuid: uuid, docName: docName}, ...docsList])
  }

  // set the component to it's default state
  const setDefaultState = () => {
    setUploadingFile(false)
    setDownloadingFile(false)
    setBuffer(null)
    setError(null)
    setSelectedUuid("")
    setLink("")
    setKey("")
  }

  // read file as array buffer
  const fileReader = new FileReader()
  fileReader.onloadend = async () => {
    setDefaultState()
    setSubmitted(false)

    const buffer = Buffer.from(fileReader.result)
    // find document key in the document text, on the first page
    const uuid = await findUUIDInText(buffer)

    if (!uuid) {
      setError({msg: "No Document Key found", priority: "warning"})
      return
    }

    // check if the document with this document key was already uploaded
    const truncated = uuidRemoveDashes(uuid)
    if (docsList.find( (e) => {
      return e === truncated
    })) {
      setError({msg: "Document Key already used", priority: "danger"})
      return
    }

    setBuffer(buffer)
    setUploadingFile(true)
    setError(null)
  }


  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  // check if the document key was already used
  const isUsedUUID = async (uuid) => {
    // noinspection JSValidateTypes
    const res = await contract.methods.documents("0x" + uuid).call();
    return res.cid !== ""
  }

  // react to the pdf file change
  const handleFileChange = async (file) => {
    if (!file) return
    displayPreview(file)
    fileReader.readAsArrayBuffer(file)
  }

  // show the preview of the uploaded pdf
  const displayPreview = (pdf) => {
    setPdf(pdf)
    setPageNumber(1)
  }

  //load the document data for blockchain with the document key
  const getDocumentFromBlockchain = async (uuid) => {
    // noinspection JSValidateTypes
    return await contract.methods.documents("0x" + uuid).call();
  }

  // download document from ipfs, decrypt it using the wallet signature, and display preview
  const downloadDocument = async (uuid) => {
    try {
      setDefaultState()

      // download the document data from blockchain
      const {cid, path} = await getDocumentFromBlockchain(uuid)
      // sign the document hash to get the decryption key
      const key = await getKeyFromOriginalCid(cid, web3, account)

      const encryptedBase64 = await downloadFromIPFS(path)

      // decrypt file
      const bytes = await CryptoJS.AES.decrypt(encryptedBase64, key)
      const originalBase64Text = bytes.toString(CryptoJS.enc.Utf8)
      const buffer = Buffer.from(originalBase64Text, 'base64')

      setDownloadingFile(true)
      setBuffer(buffer)
      setSelectedUuid(uuid)
      setKey(key)
      //display the file
      displayPreview("data:application/pdf;base64,"+ originalBase64Text)
    } catch (e) {
      alert(e.message)
    }
  }

  // convert file to base64 and encrypt it with the hash sign as encryption key
  const encryptFile = async (file, cid) => {
    const base64 = await pdf2base64(URL.createObjectURL(file))
    const key = await getKeyFromOriginalCid(cid, web3, account)
    const encryptedFileBase64 = await CryptoJS.AES.encrypt(base64, key).toString();
    return {encryptedFileBase64, key}
  }

  // react to submit button click
  const handleSubmit = async (fileName) => {
    setSubmitted(true)
    const cid = await of(buffer)
    const uuid = uuidRemoveDashes(await findUUIDInText(buffer))

    const usedUUID = await isUsedUUID(uuid)
    if (usedUUID) {
      setError({msg: "Document already uploaded", priority: "warning"})
      return
    }

    const {encryptedFileBase64, key} = await encryptFile(pdf, cid)
    console.log(key)
    await uploadFile(uuid, cid, encryptedFileBase64, key, fileName)
  }

  // upload the hash and ipfs location on the blockchain
  const uploadToSmartContract = async (uuid, originalFileCid, encryptedFileIPFSCid) => {
    const uuidHex = "0x" + uuid
    console.log({uuid, originalFileCid, encryptedFileIPFSCid})

    //calculate the gas needed for transaction
    // noinspection JSValidateTypes
    const gasEstimate = await contract.methods.addDocument(uuidHex, originalFileCid, encryptedFileIPFSCid)
      .estimateGas({from: account})

    //execute transaction
    // noinspection JSValidateTypes
    return await contract.methods.addDocument(uuidHex, originalFileCid, encryptedFileIPFSCid)
      .send({ from: account, gas: gasEstimate})
      .on('transactionHash', (hash) => {
        console.log(hash)
      })
  }

  // upload the file data (key, encrypted file, file name, uploader account) to DB
  const uploadFileToFirebase = async (uuid, data) => {
    await axios.post(`${apiDomain}/documents/${uuid}`, data);
  }

  // upload the file to DB, smart contract and IPFS
  const uploadFile = async (uuid, originalFileCid, encryptedFile, key, fileName) => {
    try {

      const ipfsResult = await uploadToIPFS(encryptedFile)
      await uploadFileToFirebase(uuid, {
        originalCid: originalFileCid,
        encryptedFile: encryptedFile,
        encryptedFileCid: ipfsResult.path,
        owner: account,
        key: key,
        fileName: fileName
      })

      await uploadToSmartContract(uuid, originalFileCid, ipfsResult.path)

      const insertedDocUUID = await getUUIDByIterator(docsList.length)
      // add the file to list of added files
      addUUIDToList(insertedDocUUID)
    } catch (e) {
      setSubmitted(false)
      alert(e.message)
    }
  }

  // upload the key to the DB to create one time link
  const createOneTimeLink = async () => {
    setLink("loading")
    const res = await axios.post(`${apiDomain}/links`, {key: key, uuid: selectedUuid});
    if (res.data.error) {
      alert(res.data.error)
    }
    const link = window.location.origin + "/links" + res.data.path
    setLink(link)
    const textField = document.createElement('textarea')
    textField.innerText = link
    // copy the link when it is created
    document.body.appendChild(textField)
    textField.select()
    document.execCommand('copy')
    textField.remove()
  }

    return (
      <Container fluid={true} className="App" >
        <Row >
          <Col md={8}>
            <br />
            <Upload handleSubmit={handleSubmit}
                    handleFileChange={handleFileChange}
                    disabledButton={!uploadingFile || error || submitted}
            />
            { error
              ? <Alert key={"alert-err"} variant={error.priority}>
                {error.msg}
              </Alert>
              : <></>
            }
            <br />
              <Card style={{padding: "40px", borderWidth: pdf ? 1 : 0}} >
                <div id="pdfWrapper"
                  ref={(ref) => setPdfWrapper(ref) }>
                  <div hidden={!pdf}>
                    <div hidden={!downloadingFile}>
                      <br/>
                      <Row className="justify-content-between">

                        <InputGroup className="mb-3">
                          <InputGroup.Text>{link ? "Link": "Key"}</InputGroup.Text>
                          <FormControl readOnly={true} type="text" value={link || key}/>
                          <Button onClick={createOneTimeLink} disabled={link}>
                            {link ? "Copied": "Create link"}
                          </Button>
                        </InputGroup>
                      </Row>
                    </div>
                    <br />

                    <Row>
                      <Col md={1}>
                        <Button disabled={pageNumber === 1}
                                hidden={numPages===1}
                                onClick={()=> setPageNumber(pageNumber - 1)}
                        >
                          {"<"}
                        </Button>
                      </Col>
                      <Col md={10}>
                        <Button download={ fileName + ".pdf"}
                                hidden={!downloadingFile}
                                href={pdf}>
                          Download
                        </Button>
                      </Col>
                      <Col md={1}>
                        <Button disabled={pageNumber === numPages}
                                hidden={numPages===1}
                                onClick={()=> setPageNumber(pageNumber + 1)}
                        >
                          {">"}
                        </Button>
                      </Col>
                    </Row>

                    <Row>
                      <Document file={pdf}
                                onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber}  width={pdfWrapperWidth} />
                      </Document>
                    </Row>
                  </div>
                </div>
              </Card>
          </Col>
          <Col md={4}>
            <ListFiles docsList={docsList}
                       downloadDocument={downloadDocument}
                       selectedItem={selectedUuid}/>
          </Col>
        </Row>
      </Container>
    );

}

export default Landing;
