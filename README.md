This project was bootstrapped with [Truffle React Landing](https://trufflesuite.com/boxes/react/).

[VIDEO DEMO](https://www.youtube.com/watch?v=IjUUzXY50cU&feature=youtu.be)

[INSTALLATION VIDEO DEMO](https://youtu.be/o4O37rxvr88)

[DEPLOYMENT VIDEO DEMO](https://youtu.be/ijcGiA6eIfc)

## Project configuration
[Truffle](https://trufflesuite.com/) the blockchain DApp development kit was installed with the next environment configuration.

Truffle v5.5.7 (core: 5.5.7)

Ganache v^7.0.3

Solidity - 0.8.13 (solc-js)

Node v14.18.1

NPM v6.14.15

Web3.js v1.5.3

## Running the application
To run the project you would need to install only 
NodeJs and NPM since everything else needed only to configure and deploy the contract.

We've already done it, so you can use one deployed on rinkeby test network.

0. Install [NodeJS](https://nodejs.org/en/)

1. Update the comparison api access token by path: [./backend/.env](./backend/.env)

`COMPARISON_ID` and `COMPARISON_TOKEN` are environment variables for the Draftable API. The pre-entered variables were for an account used during the development of the Proof of Concept, which was only valid for 30 days from sign up. The client may have to sign up for a new account on Draftable and obtain these variables for their new account from the dashboard. Please refer to their official site [api.draftable.com](https://api.draftable.com/) and github [github](https://github.com/draftable/compare-api-node-client)

![alt text](./assets/207.png?raw=true)
![image](https://user-images.githubusercontent.com/91133409/172295538-85722bc6-5ed6-4513-8016-3d9521f3e60e.png)

2. Firstly we need to run the backend server.

Go to the [backend directory](./backend) run
`npm install`
to install all dependencies
```bash
...\Capstone\backend> npm install
npm WARN backend@1.0.0 No description
npm WARN backend@1.0.0 No repository field.
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.3.2 (node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.3.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})

audited 661 packages in 24.318s

84 packages are looking for funding
  run `npm fund` for details
```

and run 
`npm start`
to start the server

```bash
...\Capstone\backend> npm start

> backend@1.0.0 start F:\Projects\Blockchain and Backend development\Capstone\backend
> node index.js

Server listening at http://localhost:3001
```
After that the backend server will be running on the http://localhost:3001 host.

3. After that we need to run the frontend server. In another terminal run next commands.
Go to the [client directory](./client), run
   `npm install`
   to install all dependencies

```bash
...\Capstone\client> npm install
npm WARN backend@1.0.0 No description
npm WARN backend@1.0.0 No repository field.
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@2.3.2 (node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.3.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})

audited 661 packages in 24.318s

84 packages are looking for funding
  run `npm fund` for details
```

and run

####`npm start`
```bash
...\Capstone\client> npm start

> client@0.1.0 start F:\Projects\Blockchain and Backend development\Capstone\client
> react-scripts start
Starting the development server...
```
http://localhost:3000 will be oppened automatically once the frontend is compiled to view it in the browser.

4. Last thing is to set up [metamask wallet](https://metamask.io/) to be used in the application for admin permissions (uploading documents).

Go to the [https://metamask.io](https://metamask.io/) and install the extension for your browser.
![alt text](./assets/-1.png?raw=true)
When you will be configuring the account please select import wallet.
![alt text](./assets/-2.png?raw=true)
Input next seed phrase 
###`garage gloom promote pumpkin sentence powder power ball fan truck stumble satisfy`
and your password
![alt text](./assets/-3.png?raw=true)
Select rinkeby network (thats the network on which we deployed the smart contract)
![alt text](./assets/-4.png?raw=true)
![alt text](./assets/-5.png?raw=true)
![alt text](./assets/-6.png?raw=true)
This account should have some testing ether to pay for transactions, but in case it's not enough,
you can request some here https://rinkebyfaucet.com/ or here https://faucets.chain.link/
![alt text](./assets/-8.png?raw=true)
After that when you update the page you will be able to see the 
account address at the top right part of the screen
![alt text](./assets/-7.png?raw=true)

#### Now we can use the application

## Project Configuration
In case you need to set up the project from zero.

###Truffle installation:

1. Install [NodeJS](https://nodejs.org/en/)

It will automatically install the NPM

2. Install [git](https://git-scm.com/)

3. Install truffle globally ``npm install -g truffle``

Truffle will automatically install Ganache, Web3, and Solidity

### Setup Firestore project
For the project we were using the Firebase Firestore as a database and authentication provider.

For this you need to set up the [firebase project](https://console.firebase.google.com/)

1. Go to the [firebase console](https://console.firebase.google.com/) and create new project
![alt text](./assets/1.bmp?raw=true)
![alt text](./assets/2.png?raw=true)
2. Crete Firestore DB
![alt text](./assets/3.png?raw=true)
![alt text](./assets/4.png?raw=true)
![alt text](./assets/5.png?raw=true)
3. Setup rulles to prevent non-permitted access
![alt text](./assets/6.png?raw=true)
We were using the next rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    //request.time < timestamp.date(2022, 12, 22)
    match /requests/{document=**} {
      allow write: if 
        request.auth != null && 
        (
         ( 
          request.resource.data.userEmail == request.auth.token.email 
           &&
          !request.resource.data.keys().hasAny(["permit"])
         )
          ||
         (
          exists(/databases/$(database)/documents/admin/$(resource.data.owner)) 
           &&
          get(/databases/$(database)/documents/admin/$(resource.data.owner))
          .data.userId == request.auth.uid
         )
        )
      allow read: if 
       request.auth != null && 
       (
        resource.data.userEmail == request.auth.token.email 
         ||
        (
         exists(/databases/$(database)/documents/admin/$(resource.data.owner)) 
          &&
         get(/databases/$(database)/documents/admin/$(resource.data.owner))
         .data.userId == request.auth.uid
        )
       )
     }
    
    match /admin/{address} {
      allow read: if true;
        
      allow write: if false;
        
    }
    
    match /links/{address} {
      allow read, write: if false;
    }
    
    match /permit/{address}/{document=**} {
    	function isAdmin(address) {
      	let admin = get(/databases/$(database)/documents/admin/$(address))
        .data.userId == request.auth.uid;
        return admin;
      }
      allow read: if true;
      allow write: if isAdmin(address);
    }
    
    match /documents/{docId} {
      allow read: if true;
      allow write: if false;
      
      function hasAccess(docId) {
      	let common = get(/databases/$(database)/documents/documents/$(docId));
      	let permit = exists(/databases/$(database)/documents/permit/$(common.data.owner)
        /user/$(request.auth.token.email)/doc/$(docId));
      	let admin = get(/databases/$(database)/documents/admin/$(common.data.owner))
        .data.userId == request.auth.uid;
        return admin || permit;
      }
      
      match /private/data {
        allow read: if request.auth != null && hasAccess(docId);
        
        allow write: if false;
      }
    }
  }
}
```
4. Create authentication token for the client DB access
![alt text](./assets/7.png?raw=true)
![alt text](./assets/8.png?raw=true)
![alt text](./assets/9.png?raw=true)
Copy the DB authentication token to the [./client/src/config/config.js](./client/src/config/config.js)
![alt text](./assets/10.png?raw=true)
![alt text](./assets/10.5.png?raw=true)
5. Create the authentication token for the backend application
![alt text](./assets/11.png?raw=true)
Rename file to serviceAccount.json and move to the  [./backend/firebase/serviceAccount.json](./backend/firebase) path
![alt text](./assets/12.png?raw=true)
![alt text](./assets/11.5.png?raw=true)
6. Create the authentication provider for the application
![alt text](./assets/13.png?raw=true)
![alt text](./assets/14.png?raw=true)
![alt text](./assets/15.png?raw=true)

Now we ready with setting up the database and authentication provider.
### Deploy the smart contract.
1. Firstly we need to delete the existing smart contract abi file stored in the next locations
[./backend/smartContract](./backend/smartContract) and [./client/src/contracts](./client/src/contracts)
![alt text](./assets/101.png?raw=true)
2. In the root folder (Capstone) we need to compile the new sart contract abi.
Run the next command
### ` truffle compile`
```bash
...\Capstone> truffle compile

Compiling your contracts...
===========================
> Compiling .\contracts\DocumentsHashStorage.sol
> Compiling .\contracts\DocumentsHashStorage.sol
> Compiling .\contracts\Migrations.sol
> Artifacts written to ...\Capstone\client\src\contracts
> Compiled successfully using:
   - solc: 0.8.13+commit.abaa5c0e.Emscripten.clang
```
3. Copy new [DocumentsHashStorage.json](./client/src/contracts/DocumentsHashStorage.json) 
from ./client/src/contracts/DocumentsHashStorage.json folder to the 
[./backend/smartContract](./backend/smartContract) folder

4. Now we need to set up the HTTPS provider to ethereum network.

If you want to use localhost blockchain network you can run `truffle develop`on the root folder and use next http provider link:
`http://127.0.0.1:8545` and network number `5777`, but I will show you example with the real one.

Here is the link how to do it using the [infura](https://andresaaap.medium.com/how-to-deploy-a-smart-contract-on-a-public-test-network-rinkeby-using-infura-truffle-8e19253870c4)
please use it if you have any questions. I will show only the most important part.

Go to the [https://infura.io/dashboard](https://infura.io/dashboard) and click create new project.
![alt text](./assets/102.png?raw=true)
Select ethereum network
![alt text](./assets/103.png?raw=true)
Select the network you want, (I was using the rinkeby test network) there are many options. 
If you are going to deploy it on mainnet network it's better to select a cheaper one (like polygon).
![alt text](./assets/104.png?raw=true)
Copy the endpoint link
![alt text](./assets/105.png?raw=true)
and paste it in the environment files for backend, frontend, and truffle, so they will have access to the smart contract.

  4.1 For backend it's file can be found by path [./backend/.env](./backend/.env)
![alt text](./assets/106.png?raw=true)

You will also need to paste the network number
![alt text](./assets/107.png?raw=true)

Different networks have different numbers, it can be found here [https://chainlist.org/](https://chainlist.org/)
![alt text](./assets/108.png?raw=true)

  4.2 For frontend it's environment file can be found by path [./client/src/config/config.js](./client/src/config/config.js)
![alt text](./assets/109.png?raw=true)

4.2 For truffle it's environment file can be found by path [./.env](./.env)
please add another variable for your network provider link (example is INFURA_RINKEBY, INFURA_ROPSTEN...)
![alt text](./assets/110.png?raw=true)

5. Now we need to set up the wallet account to deploy the smart contract on the network.
For this we will use metamask as example. 

Log out of the existing account if you want to use another one, and create a new one. 
(For this you would need to remove the metamask extension and reinstall it)

Now go to the metamask and go to settings.
![alt text](./assets/201.png?raw=true)
Select security tab
![alt text](./assets/202.png?raw=true)
Select reveal secret recovery key
![alt text](./assets/203.png?raw=true)
Copy it in the truffle environment file by path [./.env](./.env)
![alt text](./assets/204.png?raw=true)
![alt text](./assets/205.png?raw=true)

Now run 'npm install' in the root folder (Capstone) if you did not do it before, to install the needed dependency 
Open the [truffle-config](./truffle-config.js) file and add your network, 
I have added examples for most of the test networks but if it's not in the list add a new one.
Please refer to [article](https://andresaaap.medium.com/how-to-deploy-a-smart-contract-on-a-public-test-network-rinkeby-using-infura-truffle-8e19253870c4)

and run
'`truffle migrate --network <your network>` to deploy the contract, 
it will return you the contract address and the deployer address

6. If you are going to deploy the backend  on the public server or use another IPFS please update the domain for them in 
the frontend application by path [./client/src/config/config.js](./client/src/config/config.js)
![alt text](./assets/206.png?raw=true)

7. The last thing to update is the configurations for comparison api and secret keys for encryption of keys for the DB
PORT - port of the backend server.
SECRET - the word that is used to encrypt the keys on the DB.
SECRET2 - also encrypts keys, but for the one time link.
COMPARISON_ID and COMPARISON_TOKEN - is the compare API tokens for draftable/compare-api package
please refer to their official site [api.draftable.com](https://api.draftable.com/)
and github [github](https://github.com/draftable/compare-api-node-client)
![alt text](./assets/207.png?raw=true)
