import React from 'react';
import Identicon from 'identicon.js';
import {Container, Navbar, Nav, Button} from "react-bootstrap";
import {Link, useNavigate} from 'react-router-dom';
import {UserAuth} from "../contexts/AuthContext";

/**
 * Navigation bar component at the top of the screen
 * @param props.account - string, current wallet account
 * @param props.isOwner - boolean, true if acount is the smart contract owner, false otherwise
 * @returns {JSX.Element} - bootstrap [Navbar]{@link https://react-bootstrap.github.io/components/navbar/}
 * @constructor
 */
const MyNavbar = (props) => {
  const { loggedInUser } = UserAuth();
  const navigate = useNavigate()

  async function handleLogOut(){
    navigate("/logout");
  }

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            alt=""
            src={process.env.PUBLIC_URL + 'logo192.png'}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Validate</Nav.Link>
            <Nav.Link as={Link} to="/documents">My Documents</Nav.Link>
            {
              //show navigation buttons if the wallet has permitted account
              props.account ?
                <>
                  <Nav.Link as={Link} to="/admin">Upload</Nav.Link>
                  <Nav.Link as={Link} to="/admin/requests">Requests</Nav.Link>
                  {/*show navigation button if the wallet is owner account*/}
                  {props.isOwner && <Nav.Link as={Link} to="/admin/add">Add Address</Nav.Link>}
                </>
                : <></>
            }
          </Nav>

          <Nav>
            {
              //show wallet account avatar
              props.account &&
              <div style={{
                display: 'flex',
                alignItems: 'center',
              }}>
                <img
                  className='ml-2'
                  width='30'
                  height='30'
                  src={`data:image/png;base64,${new Identicon(props.account, 30).toString()}`}
                  alt="Account address"
                />
                <Nav.Link>{props.account}</Nav.Link>
              </div>
            }{
              // depending on the current path change the link from sign in to sign up and sign out
              loggedInUser ?
                  <>
                    <Nav.Link hidden={props.account}>{loggedInUser.email}</Nav.Link>
                    <Button variant="outline-success" onClick={handleLogOut}>Log Out</Button>
                  </>
                : <Button variant="outline-success"
                          as={Link}
                          to={window.location.pathname === "/login" ? "/signup" : "/login"}>
                    {window.location.pathname === "/login" ? " Sign Up" : "Log In"}
                </Button>
            }
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;