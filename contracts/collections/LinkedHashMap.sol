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
import "./ILinkedHashMap.sol";

contract LinkedHashMap is ILinkedHashMap {
    DomainManager public dm;
    IAKAP public akap;
    IERC721 public erc721;

    uint public rootPtr;
    uint public bodyPtr;
    uint public headPtr;
    uint public tailPtr;

    bool public haveBody;
    bool public haveHead;
    bool public haveTail;

    constructor(address _dmAddress, uint _rootPtr) public {
        dm = DomainManager(_dmAddress);
        akap = dm.akap();
        erc721 = IERC721(address(akap));
        rootPtr = _rootPtr;

        require(akap.exists(rootPtr), "LinkedHashMap: No root node");
        bodyPtr = akap.hashOf(rootPtr, bytes("body"));
        headPtr = akap.hashOf(rootPtr, bytes("head"));
        tailPtr = akap.hashOf(rootPtr, bytes("tail"));
    }

    modifier onlyApproved() {
        require(erc721.isApprovedForAll(address(dm), msg.sender), "LinkedHashMap: Not approved for all");

        _;
    }

    function ptr(uint ref) internal view returns (uint) {
        if (!akap.exists(ref)) return 0;
        return akap.seeAlso(ref);
    }

    function head() public view returns (uint) {
        return ptr(headPtr);
    }

    function tail() public view returns (uint) {
        return ptr(tailPtr);
    }

    function body() public view returns (uint) {
        return bodyPtr;
    }

    function setHead(uint newHead) internal {
        if (!haveHead) {
            require(dm.claim(rootPtr, bytes("head")) > 0, "LinkedHashMap: Unable to claim head");
            haveHead = true;
        }
        akap.setSeeAlso(headPtr, newHead);
    }

    function setTail(uint newTail) internal {
        if (!haveTail) {
            require(dm.claim(rootPtr, bytes("tail")) > 0, "LinkedHashMap: Unable to claim tail");
            haveTail = true;
        }
        akap.setSeeAlso(tailPtr, newTail);
    }

    function setNext(uint keyPtr, uint nextPtr) internal {
        (bytes memory value, uint prev,) = decode(akap.nodeBody(keyPtr));
        akap.setNodeBody(keyPtr, encode(value, prev, nextPtr));
    }

    function setPrev(uint keyPtr, uint prevPtr) internal {
        (bytes memory value,, uint next) = decode(akap.nodeBody(keyPtr));
        akap.setNodeBody(keyPtr, encode(value, prevPtr, next));
    }

    function encode(bytes memory value, uint prev, uint next) public pure returns (bytes memory entry) {
        return abi.encodePacked(value, prev, next);
    }

    function decode(bytes memory entry) public pure returns (bytes memory value, uint prev, uint next) {
        uint len = entry.length;

        require(len >= 0x40, "LinkedHashMap: Invalid entry length");

        assembly {
            prev := mload(add(entry, sub(len, 0x20)))
            next := mload(add(entry, len))
            mstore(entry, sub(len, 0x40))
        }

        return (entry, prev, next);
    }

    function getByRef(uint ref) public view returns (bytes memory value, uint prev, uint next, uint, bool present) {
        if (!akap.exists(ref)) return ("", 0, 0, ref, false);

        bytes memory entry = akap.nodeBody(ref);
        if (entry.length == 0) return ("", 0, 0, ref, false);

        (value, prev, next) = decode(entry);
        return (value, prev, next, ref, true);
    }

    function get(bytes memory key) public view returns (bytes memory value, uint prev, uint next, uint ref, bool present) {
        return getByRef(akap.hashOf(bodyPtr, key));
    }

    function existsByRef(uint ref) public view returns (bool present) {
        (,,,, present) = getByRef(ref);
    }

    function exists(bytes memory key) public view returns (bool) {
        return existsByRef(akap.hashOf(bodyPtr, key));
    }

    function put(bytes memory key, bytes memory newValue) public onlyApproved() returns (bytes memory oldValue, uint prev, uint next, uint ref, bool present) {
        if (!haveBody) {
            require(dm.claim(rootPtr, bytes("body")) > 0, "LinkedHashMap: Unable to claim body");
            haveBody = true;
        }

        (oldValue, prev, next, ref, present) = get(key);

        if (prev == 0 && next == 0) {
            // New entry
            require(dm.claim(bodyPtr, key) > 0, "LinkedHashMap: Unable to claim entry");

            uint tailRef = tail();

            if (tailRef == ref) {
                // We're updating the only entry
                tailRef = 0;
            }

            if (tailRef == 0) {
                // Empty map, set head
                setHead(ref);
            } else {
                // Update previous entry pointer
                setNext(tailRef, ref);
            }

            // Set entry
            akap.setNodeBody(ref, encode(newValue, tailRef, 0));

            // Update tail
            setTail(ref);
        } else {
            // Existing entry
            akap.setNodeBody(ref, encode(newValue, prev, next));
        }
    }

    function remove(bytes memory key) public onlyApproved() returns (bytes memory oldValue, uint prev, uint next, uint ref, bool present) {
        if (!haveBody) {
            require(dm.claim(rootPtr, bytes("body")) > 0, "LinkedHashMap: Unable to claim body");
            haveBody = true;
        }

        (oldValue, prev, next, ref, present) = get(key);

        if (present) {
            if (prev != 0) {
                // Link next on prev to next on this entry
                setNext(prev, next);
            } else {
                // New first entry
                setHead(next);
            }

            if (next != 0) {
                // Link prev on next to prev on this entry
                setPrev(next, prev);
            } else {
                // New last entry
                setTail(prev);
            }

            // Clear this entry
            akap.setNodeBody(ref, "");
        }
    }

    function isEmpty() public view returns (bool) {
        return head() == 0;
    }
}