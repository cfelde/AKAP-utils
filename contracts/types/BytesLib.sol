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

library BytesLib {
    function asString(bytes memory b) internal pure returns (string memory) {
        return string(b);
    }

    function asUint8(bytes memory b) internal pure returns (uint8 x) {
        if (b.length == 0) {
            x = 0;
        } else {
            assembly {
                x := mload(add(b, 0x1))
            }
        }
    }

    function asUint160(bytes memory b) internal pure returns (uint160 x) {
        if (b.length == 0) {
            x = 0;
        } else {
            assembly {
                x := mload(add(b, 0x14))
            }
        }
    }

    function asUint256(bytes memory b) internal pure returns (uint256 x) {
        if (b.length == 0) {
            x = 0;
        } else {
            assembly {
                x := mload(add(b, 0x20))
            }
        }
    }

    function asBool(bytes memory b) internal pure returns (bool x) {
        if (asUint8(b) > 0) return true;

        return false;
    }
}
