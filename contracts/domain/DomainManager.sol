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
import "./IDomainManager.sol";

contract DomainManager is IDomainManager {
    IAKAP private __akap;
    IERC721 private __erc721;

    uint private __domainParent;
    bytes private __domainLabel;

    uint private __domain;

    constructor(address _akapAddress, uint _domainParent, bytes memory _domainLabel) public {
        __akap = IAKAP(_akapAddress);
        __erc721 = IERC721(_akapAddress);

        __domainParent = _domainParent;
        __domainLabel = _domainLabel;

        require(__akap.claim(__domainParent, __domainLabel) > 0, "DomainManager: Unable to claim");

        __domain = __akap.hashOf(__domainParent, __domainLabel);

        __akap.setSeeAddress(__domain, address(this));

        // DomainManager creator gets full access by default
        __erc721.setApprovalForAll(msg.sender, true);
    }

    modifier onlyApproved() {
        require(__erc721.isApprovedForAll(address(this), msg.sender), "DomainManager: Not approved for all");

        _;
    }

    function akap() public view returns (IAKAP) {
        return __akap;
    }

    function erc721() public view returns (IERC721) {
        return __erc721;
    }

    function domainParent() public view returns (uint) {
        return __domainParent;
    }

    function domainLabel() public view returns (bytes memory) {
        return __domainLabel;
    }

    function domain() public view returns (uint) {
        return __domain;
    }

    function setApprovalForAll(address to, bool approved) public onlyApproved() {
        require(to != msg.sender, "DomainManager: Approve to caller");

        __erc721.setApprovalForAll(to, approved);
    }

    function claim(bytes memory label) public returns (uint status) {
        return claim(__domain, label);
    }

    function claim(uint parentId, bytes memory label) public onlyApproved() returns (uint) {
        uint status = __akap.claim(parentId, label);

        require(status > 0, "DomainManager: Unable to claim");

        return status;
    }

    function reclaim() public returns (uint) {
        uint status = __akap.claim(__domainParent, __domainLabel);

        require(status > 0, "DomainManager: Unable to reclaim");

        return status;
    }
}
