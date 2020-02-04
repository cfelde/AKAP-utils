// Copyright (C) 2020  Christian Felde

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.5.0;

import "akap/contracts/IAKAP.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DomainManager {
    IAKAP public akap;
    IERC721 public erc721;

    uint public domainParent;
    bytes public domainLabel;

    uint public domain;

    constructor(address _akapAddress, uint _domainParent, bytes memory _domainLabel) public {
        akap = IAKAP(_akapAddress);
        erc721 = IERC721(_akapAddress);

        domainParent = _domainParent;
        domainLabel = _domainLabel;

        require(akap.claim(domainParent, domainLabel) > 0, "DomainManager: Unable to claim");

        domain = akap.hashOf(domainParent, domainLabel);

        akap.setSeeAddress(domain, address(this));

        // DomainManager creator gets full access by default
        erc721.setApprovalForAll(msg.sender, true);
    }

    modifier onlyApproved() {
        require(erc721.isApprovedForAll(address(this), msg.sender), "DomainManager: Not approved for all");

        _;
    }

    function setApprovalForAll(address to, bool approved) public onlyApproved() {
        require(to != msg.sender, "DomainManager: Approve to caller");

        erc721.setApprovalForAll(to, approved);
    }

    function claim(bytes memory label) public returns (uint status) {
        return claim(domain, label);
    }

    function claim(uint parentId, bytes memory label) public onlyApproved() returns (uint) {
        uint status = akap.claim(parentId, label);

        require(status > 0, "DomainManager: Unable to claim");

        return status;
    }

    function reclaim() public returns (uint) {
        uint status = akap.claim(domainParent, domainLabel);

        require(status > 0, "DomainManager: Unable to reclaim");

        return status;
    }
}
