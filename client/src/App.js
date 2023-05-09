import React, {useEffect, useState} from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import getWeb3 from "./lib/getWeb3";
import DocumentsHashStorageContract from "./contracts/DocumentsHashStorage.json";
import Downloading from "./pages/Downloading";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import {AuthProvider} from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import DocumentsViewer from "./pages/DocumentsViewer";
import Logout from "./pages/Logout";
import AdminRequests from "./pages/AdminRequests";
import AddAdmin from "./pages/AddAdmin";
import {Card, Container} from "react-bootstrap";

/**
 * Main application React component, contains the navigation routes for the whole application
 * and variables that needs to be resolved at the start of the application (contract, web3, etc.)
 * @returns {JSX.Element}
 * @constructor
 */
const App = () => {
  const [web3, setWeb3] = useState(null)
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [isOwner, setIsOwner] = useState(false)

  // import wallet account, web3 provider, and permitted account, if it's available
  useEffect(  () => {(async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = DocumentsHashStorageContract.networks[networkId];
        const instance = new web3.eth.Contract(
          DocumentsHashStorageContract.abi,
          deployedNetwork && deployedNetwork.address,
        );
        setWeb3(web3)
        setContract(instance)
        setAccounts(accounts)

        console.log({contract: deployedNetwork.address})
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
  })()

  }, []);

  // find the permitted account from the list of unlocked accounts
  useEffect(  () => {(async () => {
    if (!contract) return;
    if (!accounts) return;
     // noinspection JSValidateTypes
    for (const account of accounts) {
      const isPermitted = await contract.methods.permissions(account).call();
      if (isPermitted) {
        setAccount(account)
        return
      }
    }
  })()
  }, [accounts, contract])

  // detect if the account is the owner account
  useEffect(  () => {(async () => {
    if (!account) return;
    setIsOwner(await contract.methods.owner().call() === account)
  })()
  }, [account])

    return (
      <Router>
        {/*
         AuthProvider has to be a common wrapper for all components that needs authentication available
         it safe to make it a wrapper for all router components
         */}
        <AuthProvider>
          <Navbar account={account} isOwner={isOwner}/>
          {
            contract && web3 ?
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard contract={contract}
                                      web3={web3}/>}
                />

                <Route
                  path="/links/:uuid/:id"
                  element={<Downloading contract={contract}/>}
                />

                <Route
                  path="/documents"
                  element={<DocumentsViewer contract={contract} web3={web3}/>}
                />

                <Route
                  path="/admin"
                  element={ account && web3
                    ? <Landing account={account}
                               web3={web3}
                               contract={contract}/>
                    : <Container><Card><Card.Body><Card.Title>Loading Account</Card.Title></Card.Body></Card></Container>}
                />

                <Route
                  path="/admin/requests"
                  element={account
                    ? <PrivateRoute><AdminRequests account={account}/></PrivateRoute>
                    : <Container><Card><Card.Body><Card.Title>Loading Account</Card.Title></Card.Body></Card></Container>}
                />

                <Route
                  path="/admin/add"
                  element={ account && web3
                    ? <AddAdmin account={account}
                                web3={web3}
                                contract={contract}/>
                    : <Container><Card><Card.Body><Card.Title>Loading Account</Card.Title></Card.Body></Card></Container>}
                />

                <Route path="/signup" element={<SignUp />}/>

                <Route path="/login" element={<Login />}/>

                <Route path="/logout" element={<Logout />}/>

              </Routes>
              : <Container><Card><Card.Body><Card.Title>Loading Contract</Card.Title></Card.Body></Card></Container>
          }
        </AuthProvider>
      </Router>
    )
}
export default App;