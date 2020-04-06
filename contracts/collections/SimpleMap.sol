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

import "../domain/DomainManager.sol";
import "akap/contracts/IAKAP.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ISimpleMap.sol";

contract SimpleMap is ISimpleMap {
    DomainManager public dm;
    IAKAP public akap;
    IERC721 public erc721;

    uint public rootPtr;

    constructor(address _dmAddress, uint _rootPtr) public {
        dm = DomainManager(_dmAddress);
        akap = dm.akap();
        erc721 = IERC721(address(akap));
        rootPtr = _rootPtr;

        require(akap.exists(rootPtr), "SimpleMap: No root node");
    }

    modifier onlyApproved() {
        require(erc721.isApprovedForAll(address(dm), msg.sender), "SimpleMap: Not approved for all");

        _;
    }

    function get(bytes memory key) public view returns (bytes memory value) {
        uint ref = akap.hashOf(rootPtr, key);

        if (!akap.exists(ref)) {
            return "";
        }

        return akap.nodeBody(ref);
    }

    function put(bytes memory key, bytes memory newValue) public onlyApproved() {
        uint ref = akap.hashOf(rootPtr, key);

        if (!akap.exists(ref)) {
            // New entry
            require(dm.claim(rootPtr, key) > 0, "SimpleMap: Unable to claim entry");
        }

        akap.setNodeBody(ref, newValue);
    }

    function remove(bytes memory key) public onlyApproved() {
        uint ref = akap.hashOf(rootPtr, key);

        if (!akap.exists(ref)) {
            return;
        }

        akap.setNodeBody(ref, "");
    }
}