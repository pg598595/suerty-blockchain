import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Form } from "react-bootstrap";
import { UserAuth } from "../contexts/AuthContext"
import { Link, useNavigate } from 'react-router-dom';

import {Document, Page, pdfjs} from "react-pdf/dist/umd/entry.webpack";
import { Buffer } from 'buffer';
import {of} from "ipfs-only-hash";
import Web3 from "web3";

/** TODO: change */
// Import abi
const abiObject = require("../contracts/DocumentsHashStorage.json");

// Provide Contract Address
const CONTRACT_ADDRESS="0x63992aC7C4aB8F9C41e18F8e232f084EC5688B9C";

// Create web3 instance
const web3 = new Web3("http://127.0.0.1:8545/");

// Get contract instance for account
const contractInstance = new web3.eth.Contract(
    abiObject.abi,
    CONTRACT_ADDRESS
);
/** UPTO: Here */

export default function Dashboard() {
    const fileReader = new FileReader();
    let uuid, uploadedFileCid;
    let documentVerificationStatus = false;

    const [error, setError] = useState("");
    const { loggedInUser, logout } = UserAuth();
    const navigationHistory = useNavigate();
    const [loading, setLoading] = useState(false);    
    
    const [uploadedPdfFile, setUploadedPdfFile] = useState(null);
 
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);             
  
    async function handlePdfFileChange(e) {
        let currentFile=e.target.files[0];
        if(currentFile) {            
            fileReader.readAsArrayBuffer(currentFile);
            fileReader.onload = async (e) => {
                setUploadedPdfFile(e.target.result);
                const _buffer = Buffer.from(fileReader.result)
                if (! await findUUIDInText(_buffer)) {
                    alert("No Document Key found");
                    return
                }else{
                    uuid = "0x" + (await findUUIDInText(_buffer)).replace(/-/g, "");
                    uploadedFileCid = await of(_buffer);
                    documentVerificationStatus = await verifyDocument(uuid, uploadedFileCid);
                    if(documentVerificationStatus === true){
                        alert("Document is VALID!");
                    }else {
                        alert("Document is NOT VALID!");
                    }
                }
            }
        }else{
            alert("No file found");
            return
        }
    }

    async function verifyDocument(_uuid, _uploadedFileCid) {        
        // Use this code to get the information about document
        const {cid} = await contractInstance.methods
        .documents(uuid)
        .call();
        if(uploadedFileCid === cid){
            return true
        }else{
            return false
        }        
    }
    
    async function handleLogOut(){
        setError("");        
        try {
            await logout();
            navigationHistory("/login");
        } catch {
            setError ('Failed to Log Out');
        }
    }

    
    // async function handleSubmit(e) {
    //     e.preventDefault()
    //     setError('');
    //     setLoading(true);
    //     try{
            
        
    //     } catch {
        
    //     }
    //     setLoading(false);        
    // }

    async function findUUIDInText (data) {
        try {
          const loadingTask = pdfjs.getDocument(data);
          const pdf = await loadingTask.promise
          const page = await pdf.getPage(pdf.numPages)
          const textArr = await page.getTextContent()
          const text = textArr.items.map(function (s) { return s.str; }).join('')
          const uuidReg =  text.match(/[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}/i)
          return uuidReg ? uuidReg.toString() : undefined
        }catch (e) {
          alert(e.message)
        }
    }

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }    
    
    return (
        <>            
            <Card>
                <Card.Body>
                    <h2 className='text-center'>Profile</h2>
                    <hr/>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <strong>Email:</strong> {loggedInUser.email}
                    <hr/>                    
                    {/* <Form onSubmit={handleSubmit} className='text-center'> */}
                        {/* <Form.Group id="documentKey">
                            <Form.Label>Enter Document Key</Form.Label>
                            <Form.Control className="mb-2" type="text" />
                        </Form.Group> */}
                        <Form.Group controlId="formFile" className="m-3">
                            <Form.Label>Upload Document</Form.Label>                        
                            <Form.Control type="file" required onChange={handlePdfFileChange}/>
                        </Form.Group>
                        
                        {/* <Button disable={loading} className="mb-2" type="submit">Submit Document Key</Button> */}
                    {/* </Form> */}
                    
                </Card.Body>
            </Card>
            <div className='text-center'>
                <Button variant="link" onClick={handleLogOut} >Log Out</Button>
            </div>
            <div>
                {/* {documentVerificationStatus && <Alert show={documentVerificationStatus} variant="success">Document is Valid</Alert>} */}
                <div style = {{ float: "left", width:"50%", borderStyle:"solid", border: "2px solid" }}>
                    <Document
                        file={uploadedPdfFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        >
                        <Page pageNumber={pageNumber} />
                    </Document>
                </div>
                <div style = {{ borderStyle:"solid", border:"2px solid" }}>
                    <Document
                        file={uploadedPdfFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        >
                        <Page pageNumber={pageNumber} />
                    </Document>
                </div>
            </div>

        </>
    )
}