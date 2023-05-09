import React, {useState} from 'react';
import {Button, Card, Container, FormControl, InputGroup, Row} from "react-bootstrap";

/**
 *
 * @param props.handleFileChange - parent function, that will be executed on file form file change
 * @param props.handleSubmit - parent function, that will be executed on button click
 * @param props.disabledButton - parent state, controls the button disabled state
 * @returns {JSX.Element}
 * @constructor
 */
const Upload = (props) => {
  const [fileName, setFileName] = useState("")

  // send the file to the parent component
  const handleFileChange = async (e) => {
    e.preventDefault()
    props.handleFileChange(e.target.files[0], true)
  }

  // send the file to the parent component
  const handleSubmit = async (e) => {
    e.preventDefault()
    props.handleSubmit(fileName)
  }

  return(
    <Card>
      <Card.Body>
        <Card.Title>Upload new document</Card.Title>
          <Container>
            <InputGroup className="mb-3">
              <InputGroup.Text>Document Name</InputGroup.Text>
              <FormControl type="text" value={fileName} onChange={(e)=> setFileName(e.target.value)}/>
            </InputGroup>
            <InputGroup>
              <FormControl type="file" accept="application/pdf" onChange={handleFileChange}/>
              <Button variant="primary" type="submit"
                      disabled={props.disabledButton || !fileName}
                      onClick={handleSubmit}>
                Submit
              </Button>
            </InputGroup>
          </Container>
      </Card.Body>
    </Card>
  )

}

export default Upload;