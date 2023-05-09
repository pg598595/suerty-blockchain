import React, {useEffect, useState} from 'react';
import {Card, Col, ListGroup, ListGroupItem, Row, Form} from "react-bootstrap";
import {uuidToUuidWithDashes} from "../lib/utils"

const CardItem = (props) => {
  const getColor = (uuid) => {
    return props.selectedItem === uuid ? "primary" : ""
  }

  return (
    <div>
      <ListGroupItem key={props.index}
                     onClick={() => {props.downloadDocument(props.data.uuid)}}
                     variant={getColor(props.data.uuid)}>
        <Row>
          <Col md={3} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Card.Img src={process.env.PUBLIC_URL + 'logo_png.webp'}/>
          </Col>

          <Col md={9} >
            <Card.Body>
              <Card.Title className="text-break">
                {props.data.docName}
              </Card.Title>
              <Card.Text className="text-break">
                {uuidToUuidWithDashes(props.data.uuid)}
              </Card.Text>
            </Card.Body>
          </Col>
        </Row>
      </ListGroupItem>
    </div>
  )
}

const ListFiles = (props) => {
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState(props.docsList);

  /**
   * filter the list of files by the searched text
   */
  useEffect(() => {
    setFilteredList(props.docsList.filter(({uuid}) => hasText(uuid)))
  }, [searchText, props.docsList])

  // returns true if string contains substring from search input
  const hasText = (str) => {
    if(!searchText) return true
    return str.includes(searchText.toUpperCase())
  }

  return (
    <div>
      <br />

      <Card  style={{
        maxHeight: "1000px",
        overflow: "auto"
      }}>

        <Card.Body>
          <Card.Title>Uploaded documents</Card.Title>
          <Form.Control size="lg" type="text"
                        placeholder="Search"
                        onChange={e => setSearchText(e.target.value)}/>
        </Card.Body>

        <ListGroup className="list-group-flush">
          {
            filteredList
              .map((data, i) => {
                return <CardItem data={data}
                                 index={i}
                                 downloadDocument={props.downloadDocument}
                                 selectedItem={props.selectedItem}
                                 key={i}
                />
              })
          }
        </ListGroup>
      </Card>
    </div>
  )

}

export default ListFiles;