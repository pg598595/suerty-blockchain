import React, {useRef, useState} from "react";
import {
  Alert,
  Button,
  Card, Col, Container,
  Form, Row,
} from "react-bootstrap";

/**
 * Component for smart contract owner, to permit other accounts to write to the smart contract
 * @param props.contract - smart contract instance
 * @param props.account - owner wallet account
 * @returns {JSX.Element}
 * @constructor
 */
const AddAdmin = (props) => {
  const contract = props.contract;
  const account = props.account;

  const addressRef = useRef();

  const [error, setError] = useState('');


  /**
   * Executes smart contract "addOwner" function and adds new address to the permission mapping
   * @param e
   * @returns {Promise<void>}
   */
  async function handleSubmit (e){
    e.preventDefault();
    try {
      if(!addressRef.current.value){
        return setError("A valid wallet address must be provided!");
      }
      const gasEstimate = await contract.methods.addOwner(addressRef.current.value).estimateGas({from: account})
      await contract.methods.addOwner(addressRef.current.value).send({ from: account, gas: gasEstimate})
        .on('transactionHash', (hash) => {
          console.log(hash)
        })
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <Container >
      <Row className="d-flex justify-content-center">
        <Col md={6}>
          <br/>
          <Card>
            <Card.Body>
              <Card.Title className="text-center">Add A New Admin</Card.Title>
              <hr/>
              {/*hide alert element if there is no error*/}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit} className='text-center'>
                <Form.Group id="newAdminAddress">
                  <Form.Label>Enter Admin Wallet Address</Form.Label>
                  <Form.Control className="mb-2" type="text" ref={addressRef} required/>
                </Form.Group>
                <Button className="mb-2" type="submit">Add Admin</Button>
              </Form>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AddAdmin;