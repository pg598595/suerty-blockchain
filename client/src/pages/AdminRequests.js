import React, {useEffect, useState} from "react";
import {ButtonGroup, Card, Col, Container, ListGroup, ListGroupItem, Row, ToggleButton} from "react-bootstrap";
import {db} from "../lib/firebase";
import {collection, doc, getDoc, onSnapshot, query, updateDoc, where, setDoc, deleteDoc} from "firebase/firestore";
import Masonry from "react-masonry-css";
import {UserAuth} from "../contexts/AuthContext";
import {useNavigate} from "react-router-dom";


/**
 * Child component of RequestCard component. Holds 1 document Id.
 * @param props.docName - name of the document that user requests
 * @param props.docId - id of the document that user requests
 * @param props.iter - index of the document in the list of documents that user requests
 * @param props.handleAcceptDecline - function that will be executed on button click
 * @returns {JSX.Element}
 * @constructor
 */
const ListItem = (props) => {

  const [buttonState, setButtonState] = useState(null)

  const handleToggle = (val) => {
    setButtonState(val)
    props.handleAcceptDecline(props.iter, val)
  }

  return (
    <ListGroupItem>
      <Row>
        <Col className="text-wrap">
          <Card.Title>{props.docName}</Card.Title>
          <p><small>{props.docId}</small></p>
        </Col>
        <Col md={"auto"}>
          <ButtonGroup>
            <ToggleButton key={0}
                          variant={"outline-success"}
                          type="radio"
                          value={1}
                          checked={buttonState === true}
                          onClick={() => {handleToggle(true)}}
            >
              ✓
            </ToggleButton>
            <ToggleButton key={1}
                          variant={"outline-danger"}
                          type="radio"
                          value={0}
                          checked={buttonState === false}
                          onClick={() => {handleToggle(false)}}
            >
              ✘
            </ToggleButton>
          </ButtonGroup>
        </Col>
      </Row>

    </ListGroupItem>
  )
}

/**
 * Sub component of AdminRequests component. Contains the list of the requested documents for 1 user email only
 * @param props.userEmail - email of the user who requests permission
 * @param props.docData - list of documents that user requests
 * @returns {JSX.Element}
 * @constructor
 */
const RequestCard = (props) => {

  // adds/removes the document permission for user
  // DB reference: <db>/permit/<OWNER>/user/<USER_EMAIL>/doc/<DOC_ID>
  const handleAcceptDecline = async (i, isAccepted) => {
    try {
      const ref = props.docData[i].ref
      await updateDoc(ref, {permit: isAccepted, active: false})
      const documentToPermit = doc(db, "permit", props.account, "user", props.userEmail, "doc", props.docData[i].docId)
      if (isAccepted) {
        await setDoc(documentToPermit, {})
      } else {
        await deleteDoc(documentToPermit)
      }
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title className="text-wrap">{props.userEmail}</Card.Title>
      </Card.Body>
      <ListGroup className="list-group-flush">
        {
          // display the list of documents in form of ListItem component
          props.docData.map((doc, i) =>
            <ListItem key={i}
                      iter={i}
                      docId={doc.docId}
                      docName={doc.docName}
                      handleAcceptDecline={handleAcceptDecline}
            />
          )
        }
      </ListGroup>
    </Card>
  )
}

/**
 * Component that displays user requests to get the document permission for admin account
 * Displays list of user emails
 * @param props.account -wallet account (has to have a write permission)
 * @returns {JSX.Element}
 * @constructor
 */
const AdminRequests = (props) => {
  // list of user requests {email1, doc1}, {email1, doc2}, {email2, doc3}, {email2, doc1}
  const [usersRequests, setUsersRequests] = useState([])
  // list of requests reduced by user  {email1, [doc1, doc2]} {email2, [doc3, doc1]}
  const [reducedRequests, setReducedRequests] = useState([])
  const { loggedInUser } = UserAuth();
  const navigate = useNavigate()

  // check if the account is mapped to the user in the DB
  // example: table reference: <db>/admin/<OWNER> -> userId: <userId>
  useEffect(() => {
      getDoc(doc(db, "admin", props.account)).then(doc => {
        if (doc.data().userId !== loggedInUser.uid) {
          alert("you are not registered as permitted user")
          navigate("/admin")
        }
      }).catch(e => {
        navigate("/admin")
      })

  }, [])

  // reduces all requests, by the userEmail field
  // example: {email1, doc1}, {email1, doc2}, {email2, doc3}, {email2, doc1} -> /
  // -> {email1, [doc1, doc2]} {email2, [doc3, doc1]}
  useEffect(() => { //TODO check simplification
    const obj = {}
    usersRequests.forEach(v => {
      obj[v.userEmail] = [...(obj[v.userEmail] || []), {docId: v.docId, docName: v.docName, ref: v.ref}]
    });

    const arr = Object.keys(obj).reduce((s, a) => {
      s.push({userEmail: a, docData: obj[a]});
      return s;
    }, []);
    console.log(arr)
    setReducedRequests(arr)
  }, [usersRequests])

  // checks the DB for active requests
  // DB reference: <db>/requests/<collection> -> {
  //    active: true,
  //    userEmail: email1,
  //    docId: doc1,
  //    owner: ownerAddress1
  // }
  useEffect(() => {
    const requestsRef = collection(db, "requests");
    const q = query(requestsRef,
      where("active", "==", true),
      where("owner", "==", props.account)
    )
    const unsubscribe = onSnapshot(q, (docsSnapshot) => {
      docsSnapshot.docChanges().forEach((docChange, i) => {
        if (docChange.type === "added") {
          const data = docChange.doc.data()
          getDoc(doc(db, "documents", data.docId, "private", "data"))
            .then((doc) => {
              const docName = doc.exists() ? doc.data().fileName || "No name" : "No name"
              //TODO can remove ref
              setUsersRequests(arr => [...arr, {
                userEmail: data.userEmail,
                docId: data.docId,
                docName: docName,
                ref: docChange.doc.ref
              }])
            })
        }
      })
    }, (error) => {
      console.log(error.message)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <Container fluid={true}>
      <br/>
      {

        <Card>
          <Card.Body>
            <Card.Title className="text-center">
              {
                reducedRequests.length === 0 ? "You don't have any requests" : "Document requests"
              }
            </Card.Title>
          </Card.Body>
        </Card>
      }
      <br/>
      <Masonry
        breakpointCols={{default: 3, 1100: 2, 700: 1}}
        className="my-masonry-grid justify-content-center"
        columnClassName="my-masonry-grid_column"
      >
        {
          // dispalay the list of users in form of RequestCard component for each user
          reducedRequests.map(({userEmail, docData}, i) =>
            <RequestCard userEmail={userEmail} docData={docData} key={i} account={props.account}>
              {userEmail}
            </RequestCard>
          )
        }
      </Masonry>
    </Container>
  )
}

export default AdminRequests;