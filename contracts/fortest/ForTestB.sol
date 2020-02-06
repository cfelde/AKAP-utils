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
import "../types/StringLib.sol";

contract ForTestB {
    using StringLib for string;

    DomainManager public dm;
    uint public rootPtr;

    constructor(address _dmAddress, uint _rootPtr) public {
        dm = DomainManager(_dmAddress);
        rootPtr = _rootPtr;

        require(dm.akap().exists(rootPtr), "ForTestB: No root node");
    }

    function value1() external pure returns (uint) {
        return 2;
    }

    function value2() external view returns (bytes memory) {
        string memory key = "k1";
        uint valuePtr = dm.akap().hashOf(rootPtr, key.asBytes());
        return dm.akap().nodeBody(valuePtr);
    }
}
