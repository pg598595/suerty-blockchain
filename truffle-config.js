const path = require("path");
require('dotenv').config();

const HDWalletProvider = require("@truffle/hdwallet-provider")
const MetaMaskAccountIndex = 0;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    ganache_local: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, "http://127.0.0.1:8545", MetaMaskAccountIndex )
      },
      network_id: 5777
    },
    matic: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://rpc-mumbai.maticvigil.com/v1/bd76d9f2e2c3993bbfef0082f25c30d017fc1feb`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 10000000000,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.INFURA_RINKEBY
        )
      },
      network_id: 4,
      gas: 6000000,
      gasPrice: 10000000000,
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.INFURA_ROPSTEN
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: "*"
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.INFURA_GOERLI
        )
      },
      network_id: 5,
      networkCheckTimeout: 1000000,
      timeoutBlocks: 200,
      gas: 5000000,
      gasPrice: 25000000000
    },
  },
  compilers: {
    solc: {
      version: "0.8.13",
    },
  },
};
