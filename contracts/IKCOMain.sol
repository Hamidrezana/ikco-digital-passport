// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./IKCOExchange.sol";
import "./IKCOVehicleNFT.sol";

contract IKCOMain {
  using Counters for Counters.Counter;
  struct Vehicle {
    uint256 year;
    string modelName;
    string bodyNumber;
    uint256 kilometer;
    uint256 gasUsage;
  }
  IKCOExchange public exchange;
  IKCOVehicleNFT public nft;
  address public ikco;
  Counters.Counter private _tokenIdCounter;
  mapping(uint256 => Vehicle) public vehicleDetail;

  event MintNewVehicle(uint256 tokenId, address to);
  event PutOnSell(uint256 tokenId, address to, bytes32 offererId);

  modifier onlyIKCO() {
    require(msg.sender == ikco, "Sender not authorized.");
    _;
  }

  constructor(address _exchangeAddress, address _nftAddress, address _ikcoAddress) {
    require(Address.isContract(_exchangeAddress), "Exchange Contract addres isn't correct!");
    require(Address.isContract(_nftAddress), "NFT Contract addres isn't correct!");
    exchange = IKCOExchange(_exchangeAddress);
    nft = IKCOVehicleNFT(_nftAddress);
    ikco = _ikcoAddress;
  }

  function mintVehicle(
    address _to,
    string memory _uri,
    uint256 _year,
    string memory _bodyNumber,
    string memory _modelName
  ) public onlyIKCO returns (uint256) {
    uint256 tokenId = _tokenIdCounter.current();
    emit MintNewVehicle(tokenId, _to);
    nft.safeMint(_to, tokenId, _uri);
    vehicleDetail[tokenId].year = _year;
    vehicleDetail[tokenId].bodyNumber = _bodyNumber;
    vehicleDetail[tokenId].modelName = _modelName;
    vehicleDetail[tokenId].kilometer = 0;
    vehicleDetail[tokenId].gasUsage = 0;
    _tokenIdCounter.increment();
    return (tokenId);
  }

  function setKilometer(uint256 _tokenId, uint256 _kilometer) public onlyIKCO {
    require(
      vehicleDetail[_tokenId].kilometer <= _kilometer,
      "New Kilometer should bigger than last one."
    );
    vehicleDetail[_tokenId].kilometer = _kilometer;
  }

  function addGasUsage(uint256 _tokenId, uint256 _gas) public onlyIKCO {
    require(_gas >= 0, "Gas usage should bigger than zero.");
    vehicleDetail[_tokenId].gasUsage += _gas;
  }

  function getDetails(uint256 _tokenId) public view returns (Vehicle memory) {
    return vehicleDetail[_tokenId];
  }

  function placeSell(address _to, uint _tokenId, uint _price) external returns (bytes32) {
    require(msg.sender == nft.ownerOf(_tokenId), "Only NFT's owner can place offer.");
    require(nft.getApproved(_tokenId) == address(this), "Approved is not set for this NFT.");
    bytes32 offererId = exchange.placeOffering(msg.sender, _to, _tokenId, _price);
    emit PutOnSell(_tokenId, _to, offererId);
    return offererId;
  }

  function matchOrder(bytes32 _offeringId) external payable {
    (address offerer, uint tokenId) = exchange.viewOffering(_offeringId);
    exchange.closeOffering(_offeringId, msg.value);
    nft.safeTransferFrom(offerer, msg.sender, tokenId);
    payable(offerer).transfer(msg.value);
  }
}
