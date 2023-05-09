import React, {useEffect, useState} from "react";
import {Card, Alert, Form, Col, Row, Button, InputGroup, FormControl, Container} from "react-bootstrap";

import {Document, Page} from "react-pdf/dist/umd/entry.webpack";
import {Buffer} from 'buffer';
import {of} from "ipfs-only-hash";
import {
  getAddressFromCidAndKey,
  findUUIDInText,
  uuidRemoveDashes,
  uuidToUuidWithDashes,
  downloadBase64Pdf, requestPermission
} from "../lib/utils";
import {useNavigate} from "react-router-dom";
import {collection, where, query, getDocs} from "firebase/firestore";
import {UserAuth} from "../contexts/AuthContext";
import {db} from "../lib/firebase";
import pdf2base64 from "pdf-to-base64";
import {downloadFromIPFS} from "../lib/ipfs";
import CryptoJS from "crypto-js";
import axios from "axios";
import {apiDomain} from "../config/config";


/**
 * Page for document validation.
 * @param props
 * @param props.contract - contract instance
 * @param props.web3 - current web3 provider
 * @returns {JSX.Element}
 * @constructor
 */
export default function Dashboard(props) {
  const contract = props.contract
  const web3 = props.web3
  const navigate = useNavigate()
  const { loggedInUser } = UserAuth();

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfWrapper, setPdfWrapper] = useState(null)
  const [uploadedPdfFile, setUploadedPdfFile] = useState(null);
  const [pdfWrapperWidth, setPdfWrapperWidth] = useState(0)

  const [message, setMessage] = useState(null);
  const [showComparisonByKey, setShowComparisonByKey] = useState(false)
  const [uuid, setUuid] = useState("")
  const [uuidInput, setUuidInput] = useState("")
  const [key, setKey] = useState("")
  const [keySubmitButtonDisabled, setKeySubmitButtonDisabled] = useState(true)

  const [permissionChecked, setPermissionChecked] = useState(false);
  const [document, setDocument] = useState(null)

  const [comparing, setComparing] = useState(false);
  const [iFrameUrl, setIFrameUrl] = useState("");
  const [fileToDownloadBase64, setFileToDownloadBase64] = useState("");

  // set the pdf viewer width by his container dic width
  useEffect(() => {
    if (!pdfWrapper) return
    setPdfWrapperWidth(pdfWrapper.getBoundingClientRect().width)
  }, [pdfWrapper])

  // detect when the inputted key is the right decryption key for the document and unlock the display button
  useEffect(() => {(async () => {
    if (!key) return
    if (!document) return;
    const {cid, owner} = document
    try {
      const recover = await getAddressFromCidAndKey(cid, web3, key)
      setKeySubmitButtonDisabled(recover !== owner)
    } catch (e) {
      console.log(e.message)
    }
  })()
  }, [key])

  // format the document key before inputting it in the input form
  useEffect(() => {
    if (!uuid) return
    const inputValue = uuid.match(/.{1,8}/g);
    setUuidInput(inputValue ? inputValue.join("-") : "")
    setKey("")
  }, [uuid])

  // set the page state to the default one
  const setDefault = () => {
    setMessage(null)
    setPermissionChecked(false)
    setUuid("")
    setKey("")
    setDocument(null)
    setKeySubmitButtonDisabled(true)
    setShowComparisonByKey(false)
    setIFrameUrl("")
    setFileToDownloadBase64("")
    setComparing(false)
  }

  // detect file change in the file form
  async function handlePdfFileChange(e) {
    let currentFile = e.target.files[0];
    setDefault()
    if (!currentFile) return
    setUploadedPdfFile(currentFile)
    fileReader.readAsArrayBuffer(currentFile);
  }

  const fileReader = new FileReader();
  // transfor file in the array buffer form when the file is selected/changed
  fileReader.onload = async () => {
    const _buffer = Buffer.from(fileReader.result)

    //find the document key in the text of the first page
    const uuidWithDashes = await findUUIDInText(_buffer)
    if (!uuidWithDashes) {
      setMessage({
        msg: "No Document Key found. Document was not issued by App.",
        priority: "warning", buttonMessage: ""
      })
      return
    }

    const withoutDashes = uuidRemoveDashes(uuidWithDashes)
    setUuid(withoutDashes)
    const uploadedFileCid = await of(_buffer);

    //download the blockchain data for the document with this document key
    const uuid0 = "0x" + withoutDashes
    const doc = await contract.methods.documents(uuid0).call();
    setDocument(doc)

    // if there is no document with such key on the blockchain
    const {cid} = doc
    if (cid==="") {
      setMessage({msg: "Document was not issued by App.", priority: "danger", buttonMessage: ""})
      return
    }

    // if the document hash is the same with data on blockchain
    if (uploadedFileCid === cid) {
      setMessage({msg: "Document is valid.", priority: "primary", buttonMessage: ""})
      return
    }
    // if the document hash is NOT the same as data on blockchain
    setMessage({msg: "Document not valid.", priority: "danger",
      buttonMessage: loggedInUser ? "Click to compare" : "Login to request original document or input key"})
    // show field for the manual key input
    setShowComparisonByKey(true)
  }

  // set number of pages when pdf file is displayed
  function onDocumentLoadSuccess({numPages}) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // check if the user has permission to download the decryption key from DB
  const hasPermission = async () => {
    const ref = collection(db, "requests")
    const q = query(ref,
      where("permit", "==", true),
      where("userEmail", "==", loggedInUser.email),
      where("docId", "==", uuid),
    );
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  //handle click on the alert component button
  const handleAlertClick = async () => {
    // if user is not logged in redirect to /login
    if (!loggedInUser) {
      navigate('/login')
      return
    }

    // if we did not check user permission yet
    if (!permissionChecked) {
      if (!await hasPermission()) {
        setPermissionChecked(true)
        setMessage({msg: "You don't have permission. Input key or ", priority: "danger",
          buttonMessage: "Request permission"})
        return
      }
      setMessage(null)
      // if we have permission download key and create comparison with draftable api
      await handleComparison()
      return
    }
    // if we checked permission ask for permission
    await requestPermission(loggedInUser.email, uuid, document.owner)
    navigate('/documents', { state: { uuid: uuid } })
  }

  // get the comparison link from the backend and display comparison
  const handleComparison = async (decryptionKey) => {
    try {
      // download the invalid doc, conver to base64
      setComparing(true)
      const uploadedBase64 = await pdf2base64(URL.createObjectURL(uploadedPdfFile))
      const data = {
        doc1: uploadedBase64,
        uuid: uuid
      }

      if (!decryptionKey) {
        if (loggedInUser) {
          // download the decryption key from DB
          const token = await loggedInUser.getIdToken()
          const res = await axios.post(`${apiDomain}/documents/${uuid}/key`, {},{
            headers: {
              Authorization: 'Bearer ' + token,
            },
          })
          decryptionKey = res.data.key
          setKey(res.data.key)
        } else {
          setPermissionChecked(true)
          setMessage({msg: "You don't have permission. Input key or ", priority: "danger",
            buttonMessage: "Request permission"})
          return
        }
      }

      //download the valid document from IPFS
      const {path} = document
      const encryptedBase64 = await downloadFromIPFS(path)
      // decrypt the document
      const bytes = await CryptoJS.AES.decrypt(encryptedBase64, decryptionKey)
      const base64 = bytes.toString(CryptoJS.enc.Utf8)
      setFileToDownloadBase64(base64)
      data.doc2 = base64

      // create the comparison link on backend
      const res = await axios.post(`${apiDomain}/comparison`, data);
      if (res.data.error) {
        setComparing(false)
        setShowComparisonByKey(true)
        return alert(res.data.error)
      }

      // show comparison
      setIFrameUrl(res.data.viewerURL);
    } catch (e) {
      setComparing(false)
      setShowComparisonByKey(true)
      alert(e.message)
    }
  }

  // download the file from client app on local file system
  const downloadFile = (fileBase64) => {
    if (!fileBase64) {return alert("Error")}
    downloadBase64Pdf(uuidToUuidWithDashes(uuid), fileBase64)
  }

  return (
    <Container fluid={true}>
      <br/>
      <Row>
        <Col md={2}/>
        <Col md={8}>
          <Card >
            <Card.Body>
              <Card.Title className="text-center">Document Verification</Card.Title>
                <Form.Group controlId="formFile" className="m-3">
                  <Form.Label>Upload a Document to Verify</Form.Label>
                  <Form.Control type="file" accept="application/pdf" required onChange={handlePdfFileChange}/>
                </Form.Group>
            </Card.Body>
          </Card>
          {
            message &&
              <Alert variant={message.priority} className="text-center">
                {message.msg}
                {
                  message.buttonMessage &&
                    <Alert.Link onClick={handleAlertClick} >
                      {message.buttonMessage}
                    </Alert.Link>
                }
              </Alert>
          }
          {
            showComparisonByKey &&
              <Card>
                <Card.Body>
                  <Card.Title className="text-center">Compare using decryption key</Card.Title>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>Document Key</InputGroup.Text>
                      <FormControl type="text" value={uuidInput} readOnly={true}/>
                    </InputGroup>
                    <InputGroup className="mb-3">
                      <InputGroup.Text>Decryption Key</InputGroup.Text>
                      <FormControl type="text" value={key} onChange={(e)=> setKey(e.target.value)}/>
                      <Button variant={keySubmitButtonDisabled ? "outline-secondary": "primary"}
                              onClick={()=>handleComparison(key)}
                              disabled={keySubmitButtonDisabled}
                      >
                        Submit
                      </Button>
                    </InputGroup>
                </Card.Body>
              </Card>
          }
          <Card style={{padding: "40px", borderWidth: uploadedPdfFile ? 1 : 0}} hidden={comparing} >
            <div id="pdfWrapper"
                 ref={(ref) => setPdfWrapper(ref) }>
              <div hidden={!uploadedPdfFile}>
                <Document
                  file={uploadedPdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page pageNumber={pageNumber} width={pdfWrapperWidth}/>
                </Document>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={2}/>
      </Row>
      <Row hidden={!comparing}>
        <Col className="d-flex justify-content-center">
          <Button disabled={!iFrameUrl} onClick={()=> {downloadFile(fileToDownloadBase64)}}>{iFrameUrl ? "Download" : "Loading"}</Button>
        </Col>
      </Row>
      <Row hidden={!comparing}>
        <Col>
          <iframe src={iFrameUrl} allowFullScreen style={{width: "100%", height: "100%", minHeight: "600px"}}/>
        </Col>
      </Row>
    </Container>
  )
}