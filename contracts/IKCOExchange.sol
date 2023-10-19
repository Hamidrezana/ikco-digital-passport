// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract IKCOExchange is Ownable {
  struct Offer {
    address to;
    address offerer;
    uint256 tokenId;
    uint256 price;
    bool closed;
  }
  address public operator;
  uint256 offeringNonce = 0;
  mapping(bytes32 => Offer) public offeringRegistry;

  modifier onlyOperator() {
    require(msg.sender == operator, "Operator not authorized.");
    _;
  }

  function setMainContractAddress(address _address) external onlyOwner {
    require(Address.isContract(_address), "Main Contract addres isn't correct!");
    operator = _address;
  }

  function placeOffering(
    address _offerer,
    address _to,
    uint256 _tokenId,
    uint256 _price
  ) external onlyOperator returns (bytes32) {
    bytes32 offeringId = keccak256(abi.encodePacked(offeringNonce, _tokenId));
    offeringRegistry[offeringId] = Offer({
      offerer: _offerer,
      tokenId: _tokenId,
      price: _price,
      to: _to,
      closed: false
    });
    offeringNonce += 1;
    return (offeringId);
  }

  function closeOffering(bytes32 _offeringId, uint256 _value) external onlyOperator {
    Offer storage offer = offeringRegistry[_offeringId];
    require(tx.origin == offer.to, "Caller is not authorize.");
    require(_value >= offer.price, "Not enough funds to buy.");
    require(offer.closed != true, "Offering is closed.");
    offer.closed = true;
  }

  function viewOffering(bytes32 _offeringId) external view returns (address, uint256) {
    return (offeringRegistry[_offeringId].offerer, offeringRegistry[_offeringId].tokenId);
  }
}
