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

contract LinkedHashMap {
    DomainManager public dm;
    uint public rootPtr;
    uint public bodyPtr;
    uint public headPtr;
    uint public tailPtr;
    bool public haveBody;
    bool public haveHead;
    bool public haveTail;

    constructor(address _dmAddress, uint _rootPtr) public {
        dm = DomainManager(_dmAddress);
        rootPtr = _rootPtr;

        require(dm.akap().exists(rootPtr), "LinkedHashMap: No root node");
        bodyPtr = dm.akap().hashOf(rootPtr, bytes("body"));
        headPtr = dm.akap().hashOf(rootPtr, bytes("head"));
        tailPtr = dm.akap().hashOf(rootPtr, bytes("tail"));
    }

    function ptr(uint ref) internal view returns (uint) {
        if (!dm.akap().exists(ref)) return 0;
        return dm.akap().seeAlso(ref);
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
            require(dm.akap().claim(rootPtr, bytes("head")) > 0, "LinkedHashMap: Unable to claim head");
            haveHead = true;
        }
        dm.akap().setSeeAlso(headPtr, newHead);
    }

    function setTail(uint newHead) internal {
        if (!haveTail) {
            require(dm.akap().claim(rootPtr, bytes("tail")) > 0, "LinkedHashMap: Unable to claim tail");
            haveTail = true;
        }
        dm.akap().setSeeAlso(tailPtr, newHead);
    }

    function setNext(uint keyPtr, uint nextPtr) internal {
        (bytes memory value, uint prev,) = decode(dm.akap().nodeBody(keyPtr));
        dm.akap().setNodeBody(keyPtr, encode(value, prev, nextPtr));
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

    function getByRef(uint ref) public view returns (bytes memory value, uint prev, uint next, uint) {
        if (!dm.akap().exists(ref)) return ("", 0, 0, ref);

        bytes memory entry = dm.akap().nodeBody(ref);
        if (entry.length == 0) return ("", 0, 0, ref);

        (value, prev, next) = decode(entry);
        return (value, prev, next, ref);
    }

    function get(bytes memory key) public view returns (bytes memory value, uint prev, uint next, uint ref) {
        return getByRef(dm.akap().hashOf(bodyPtr, key));
    }

    function put(bytes memory key, bytes memory newValue) public returns (bytes memory oldValue, uint prev, uint next, uint ref) {
        if (!haveBody) {
            require(dm.akap().claim(rootPtr, bytes("body")) > 0, "LinkedHashMap: Unable to claim body");
            haveBody = true;
        }

        (oldValue, prev, next, ref) = get(key);

        if (prev == 0 && next == 0) {
            // New entry
            require(dm.akap().claim(bodyPtr, key) > 0, "LinkedHashMap: Unable to claim entry");

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
            dm.akap().setNodeBody(ref, encode(newValue, tailRef, 0));

            // Update tail
            setTail(ref);
        } else {
            // Existing entry
            dm.akap().setNodeBody(ref, encode(newValue, prev, next));
        }
    }

    // TODO exists, remove, isEmpty
}