import React, {useRef, useState} from 'react';
import {Form, Button, Card, Alert, Container, Row, Col} from 'react-bootstrap';
import {UserAuth} from '../contexts/AuthContext';
import {Link, useNavigate} from 'react-router-dom';

export default function SignUp() {

  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const {signup} = UserAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState("false");
  const navigationHistory = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault()

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      return setError('Password and confirm password must be the same');
    }
    try {
      setError('');
      setLoading("true");
      await signup(emailRef.current.value, passwordRef.current.value);
      navigationHistory("/");
    } catch {
      setError('Sign Up Failed!');
    }
    setLoading("false");

  }

  return (
    <Container >
      <Row className="d-flex justify-content-center">
        <Col md={6}>
          <div className="m-auto mt-2">
            <Card>
              <Card.Body>
                <h2 className='text-center'>Request A Sign Up</h2>
                <hr/>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit} className='text-center'>
                  <Form.Group id="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control className="mb-2" type="email" ref={emailRef} required/>
                  </Form.Group>
                  <Form.Group id="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control className="mb-2" type="password" ref={passwordRef} required/>
                  </Form.Group>
                  <Form.Group id="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control className="mb-2" type="password" ref={confirmPasswordRef} required/>
                  </Form.Group>
                  <Button disable={loading} className="mb-2" type="submit">Sign Up</Button>
                </Form>
              </Card.Body>
            </Card>
            <div className='text-center'>
              Already have an approval? <Link to="/login">Log In</Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
