var SimpleStorage = artifacts.require("./DocumentsHashStorage.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
};
