import React, { useRef, useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { UserAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {

    const emailRef = useRef();
    const passwordRef = useRef();    
    const { login } = UserAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigationHistory = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault()
        
        try{
            setError('');
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value)
            navigationHistory("/");
        } catch {
            setError('Log In Failed!');
        }
        setLoading(false);
        
    }

    return(
        <>
            <Card>
                <Card.Body>                    
                    <h2 className='text-center'>Log In</h2>
                    <hr/>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form  onSubmit={handleSubmit} className='text-center'>
                        <Form.Group id="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control className="mb-2" type="email" ref={emailRef} required />
                        </Form.Group>
                        <Form.Group id="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control className="mb-2" type="password" ref={passwordRef} required />
                        </Form.Group>                       
                        <Button disable={loading} className="mb-2" type="submit">Log In</Button>
                    </Form>                    
                </Card.Body>
            </Card>
            <div className='text-center'>
                Don't Have an Account? <Link to="/signup">Sign Up</Link>
            </div>

        </>
    )
}
