// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DocumentsHashStorage is Ownable {

  constructor() {
    permissions[msg.sender] = true;
  }

  struct Document {
    string cid;
    string path; // can be optimized https://ethereum.stackexchange.com/questions/61100/how-much-does-it-cost-to-store-each-ipfs-hash-in-ethereum-blockchain
    address owner;
  }

  mapping(uint160 => Document) public documents;
  mapping(address => uint160[]) public ownerToUuids;
  mapping(address => uint256) public ownerToUuidsSize;
  mapping(address => bool) public permissions;

  modifier canNotModify(uint160 uuid) {
    require(
      documents[uuid].owner == address(0x0), "records can not be modified");
    _;
  }

  modifier notZero(uint160 uuid) {
    require(uuid != 0, "uuid can not be zero");
    _;
  }

  modifier onlyPermitted(address caller) {
    require(permissions[caller], "do not have permission");
    _;
  }

  function addOwner(address newOwner) public onlyOwner {
    permissions[newOwner] = true;
  }

  function getOwnerUuidSize() public view returns(uint256) {
    return ownerToUuidsSize[msg.sender];
  }

  function getOwnerUuid(uint256 i) public view returns(uint160) {
    return ownerToUuids[msg.sender][i];
  }

  function addDocument(uint160 uuid, string memory cid, string memory path)
  public
  onlyPermitted(msg.sender)
  canNotModify(uuid)
  notZero(uuid) {
    documents[uuid] = Document(cid, path, msg.sender);
    ownerToUuids[msg.sender].push(uuid);
    ownerToUuidsSize[msg.sender] += 1;
  }
}
