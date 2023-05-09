import React, {useEffect, useState} from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  FormControl,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Row
} from "react-bootstrap";
import {collection, doc, getDoc, onSnapshot, query, where} from "firebase/firestore";
import {db} from "../lib/firebase";
import {UserAuth} from "../contexts/AuthContext";
import {getAddressFromCidAndKey, requestPermission, uuidToUuidWithDashes} from "../lib/utils";
import {Document, Page} from "react-pdf/dist/umd/entry.webpack";
import axios from "axios";
import {downloadFromIPFS} from "../lib/ipfs";
import CryptoJS from "crypto-js";
import {apiDomain} from "../config/config";


/**
 * Component to show user requests for user, and display the permitted documents
 * @param props
 * @param props.contract - contract instance
 * @param props.web3 - current web3 provider
 * @returns {JSX.Element}
 * @constructor
 */
const DocumentsViewer = (props) => {
  const contract = props.contract
  const web3 = props.web3
  const {loggedInUser} = UserAuth();

  const [uuidInput, setUuidInput] = useState("")
  const [uuid, setUuid] = useState("")
  const [key, setKey] = useState("")
  const [permittedDocs, setPermittedDocs] = useState([])
  const [activeRequests, setActiveRequests] = useState([])

  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfWrapper, setPdfWrapper] = useState(null)
  const [pdfWrapperWidth, setPdfWrapperWidth] = useState(0)
  const [error, setError] = useState(null)
  const [document, setDocument] = useState(null)
  const [keySubmitButtonDisabled, setKeySubmitButtonDisabled] = useState(true)

  // format the document key before inputting it in the input form
  useEffect(() => {
    const inputValue = uuid.match(/.{1,8}/g);
    setUuidInput(inputValue ? inputValue.join("-") : "")
    setKey("")
  }, [uuid])

  // download all permitted document list
  useEffect(() => {
    if (!loggedInUser) return
    const requestsRef = collection(db, "requests");
    const q = query(requestsRef,
      where("permit", "==", true),
      where("userEmail", "==", loggedInUser.email)
    )

    // update the list in real time
    const unsubscribe = onSnapshot(q, (docsSnapshot) => {
      docsSnapshot.docChanges().forEach((docChange) => {
        if (docChange.type === "added") {
          const data = docChange.doc.data()
          getDoc(doc(db, "documents", data.docId, "private", "data"))
            .then((doc) => {
              const docName = doc.exists() ? doc.data().fileName || "No name" : "No name"
              setPermittedDocs(arr => [{
                docId: data.docId,
                docName: docName
              }, ...arr])
            })
        }
      })
    }, (error) => {
      alert(error.message)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // download all requested document list
  useEffect(() => {
    if (!loggedInUser) return
    const requestsRef = collection(db, "requests");
    const q = query(requestsRef,
      where("active", "==", true),
      where("userEmail", "==", loggedInUser.email)
    )

    const unsubscribe = onSnapshot(q, (docsSnapshot) => {
      docsSnapshot.docChanges().forEach((docChange) => {
        const data = docChange.doc.data()
          if (docChange.type === "added") {
            setActiveRequests(arr => [{
              docId: data.docId
            }, ...arr])
          }
          if (docChange.type === "modified") {
            setActiveRequests(arr => arr.filter(item => item.docId !== data.docId))
          }
      })
    }, (error) => {
      alert(error.message)
    })
    return () => {
      unsubscribe()
    }
  }, [])

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

  // set number of pages when document loadings
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  // get the document hash and IPFS location from blockchain with document Id
  const getDocumentFromBlockchain = async (withoutDashes) => {
    try {
      const uuid0 = "0x" + withoutDashes
      return  await contract.methods.documents(uuid0).call();
    }catch (e) {
      alert(e.message)
    }
  }

  // request permission for the document decryption key
  const handleRequest = async (withoutDashes) => {
    if(!withoutDashes) return
    if (!loggedInUser) return
    const {cid, owner} = await getDocumentFromBlockchain(withoutDashes)
    if (!cid) {
      setError({msg: "Document not found", priority: "danger"})
      return
    }
    await requestPermission(loggedInUser.email, withoutDashes, owner)
  }

  // display the pdf
  const handleDisplay = async (withoutDashes, decryptionKey) => {
    if(!withoutDashes) return
    setUuid(withoutDashes)

    const {cid, path, owner} = document ? document : await getDocumentFromBlockchain(withoutDashes)

    if (!cid) {
      setError({msg: "Document not found", priority: "danger"})
      return
    }

    // download the decryption key if permited
    if (!decryptionKey) {
      if (loggedInUser) {
        const token = await loggedInUser.getIdToken()
        const res = await axios.post(`${apiDomain}/documents/${withoutDashes}/key`, {},{
          headers: {
            Authorization: 'Bearer ' + token,
          },
        })
        decryptionKey = res.data.key
        setKey(res.data.key)
      } else {
        setError({msg: "Key is invalid", priority: "danger"})
      }
    }

    try {
      if (await getAddressFromCidAndKey(cid, web3, decryptionKey) !== owner ) {
        setError({msg: "Key is invalid", priority: "danger"})
        return
      }
    } catch (e) {
      setError({msg: "Key is invalid", priority: "danger"})
      return
    }

    //download the file from IPFS, decrypt it and display
    const encryptedBase64 = await downloadFromIPFS(path)
    const bytes = await CryptoJS.AES.decrypt(encryptedBase64, decryptionKey)
    const base64 = bytes.toString(CryptoJS.enc.Utf8)
    displayPreview( "data:application/pdf;base64,"+  base64)
  }

  const displayPreview = (pdf) => {
    setPdf(pdf)
    setPageNumber(1)
  }

  // format document key input before showing it
  const handleUuidInput = async (text) => {
    const upper = text.toUpperCase().replace(/[^0-9A-F]/g, "")
    if (upper.length > 40) return
    setUuid(upper)
    setError(null)

    if (upper.length !== 40) {
      setDocument(null)
      return
    }
    //download the document hash from blockchain
    const doc = await getDocumentFromBlockchain(upper)

    if (!doc.cid) {
      setError({msg: "Document not found", priority: "danger"})
      return
    }
    setDocument(doc)
  }

  return (
    <div>
      <br/>
      <Container fluid={true}>
        <Row>
          <Col md={8}>
            <Row>

              <Card>
                <Card.Body>
                  <Card.Title>Request or see document</Card.Title>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>Document Key</InputGroup.Text>
                    <FormControl type="text" value={uuidInput} onChange={(e) => handleUuidInput(e.target.value)}/>
                    <Button disabled={!document}
                            hidden={!loggedInUser}
                            onClick={() => {handleRequest(uuid)}}
                    >
                      Request
                    </Button>
                  </InputGroup>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>Decryption Key</InputGroup.Text>
                    <FormControl type="text" value={key} onChange={(e) => setKey(e.target.value)} disabled={!document}/>
                    <Button disabled={keySubmitButtonDisabled}
                            onClick={() => {handleDisplay(uuid, key)}}
                    >
                      Display
                    </Button>
                  </InputGroup>
                </Card.Body>

                {
                  error &&
                  <Alert variant={error.priority}>
                    {error.msg}
                  </Alert>
                }
              </Card>
            </Row>

            <Row>
              <Col md={1}>
                <Button disabled={pageNumber === 1}
                        hidden={numPages===1}
                        onClick={()=> setPageNumber(pageNumber - 1)}
                >
                  {"<"}
                </Button>
              </Col>
              <Col className={"text-center"} md={10}>
                <Button download={ uuid + ".pdf"}
                        hidden={!pdf}
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
              <Card style={{padding: "40px", borderWidth: pdf ? 1 : 0}} >
                <div id="pdfWrapper"
                     ref={(ref) => setPdfWrapper(ref) }>
                  <div hidden={!pdf}>
                    <Document file={pdf}
                              onLoadSuccess={onDocumentLoadSuccess}>
                      <Page pageNumber={pageNumber}  width={pdfWrapperWidth} />
                    </Document>
                  </div>
                </div>
              </Card>
            </Row>

          </Col>

          <Col md={4}>
            <Card hidden={loggedInUser}>
              <Card.Body>
                <Card.Title className="text-center">Log in to see your documents</Card.Title>
              </Card.Body>
            </Card>
            <Card
              style={{
                maxHeight: "400px",
                overflow: "auto"
              }}
              hidden={permittedDocs.length === 0}
            >

              <Card.Body>
                <Card.Title>My documents</Card.Title>
              </Card.Body>
              <ListGroup className="list-group-flush">
                {
                  permittedDocs.map((item, i) =>
                    <div onClick={() => {handleDisplay(item.docId)}} key={i}>
                      <ListGroupItem>
                        <Row>
                          <Col md={3} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Card.Img src={process.env.PUBLIC_URL + 'logo_png.webp'}/>
                          </Col>

                          <Col md={9} >
                            <Card.Title>{item.docName}</Card.Title>
                            <p><small>{uuidToUuidWithDashes(item.docId)}</small></p>
                          </Col>
                        </Row>
                      </ListGroupItem>
                    </div>
                  )
                }
              </ListGroup>
            </Card>

            <br/>

            <Card
              style={{
                maxHeight: "400px",
                overflow: "auto"
              }}
              hidden={activeRequests.length === 0}
            >
              <Card.Body>
                <Card.Title>Requests</Card.Title>
              </Card.Body>
              <ListGroup className="list-group-flush">
                {
                  activeRequests.map((item, i) =>
                    <div  key={i}>
                      <ListGroupItem>
                        <Row>
                          <Col md={3} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Card.Img src={process.env.PUBLIC_URL + 'logo_locked.png'}/>
                          </Col>

                          <Col md={9} >
                            <Card.Title>{item.docName}</Card.Title>
                            <p><small>{uuidToUuidWithDashes(item.docId)}</small></p>
                          </Col>
                        </Row>
                      </ListGroupItem>
                    </div>
                  )
                }
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default DocumentsViewer;