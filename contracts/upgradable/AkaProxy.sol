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

contract AkaProxy {
    IAKAP public akap;
    uint public rootPtr;

    constructor(address _akapAddress, uint _rootPtr) public {
        akap = IAKAP(_akapAddress);
        rootPtr = _rootPtr;

        require(akap.exists(rootPtr), "AkaProxy: No implementationPointer");
    }

    function () payable external {
        address implementationAddress = akap.seeAddress(rootPtr);
        require(implementationAddress != address(0), "AkaProxy: No implementationAddress");

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, implementationAddress, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }
}
