// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract IKCOVehicleNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
  address mainContractAddress;

  constructor() ERC721("IKCOVehicleNFT", "IKCOVN") {}

  modifier onlyMainContract() {
    require(msg.sender == mainContractAddress, "Sender not authorized.");
    _;
  }

  function safeMint(address _to, uint256 _tokenId, string memory _uri) public onlyMainContract {
    _safeMint(_to, _tokenId);
    _setTokenURI(_tokenId, _uri);
  }

  function approveToMainContract(uint256 _tokenId) public {
    approve(mainContractAddress, _tokenId);
  }

  function setMainContractAddress(address _address) external onlyOwner {
    require(Address.isContract(_address), "Main Contract addres isn't correct!");
    mainContractAddress = _address;
  }

  function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) onlyMainContract {
    super._burn(_tokenId);
  }

  function tokenURI(
    uint256 _tokenId
  ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(_tokenId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
