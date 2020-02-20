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

contract ILinkedHashMap {
    function head() public view returns (uint);

    function tail() public view returns (uint);

    function body() public view returns (uint);

    function encode(bytes memory value, uint prev, uint next) public pure returns (bytes memory entry);

    function decode(bytes memory entry) public pure returns (bytes memory value, uint prev, uint next);

    function getByRef(uint ref) public view returns (bytes memory value, uint prev, uint next, uint, bool present);

    function get(bytes memory key) public view returns (bytes memory value, uint prev, uint next, uint ref, bool present);

    function existsByRef(uint ref) public view returns (bool present);

    function exists(bytes memory key) public view returns (bool);

    function put(bytes memory key, bytes memory newValue) public returns (bytes memory oldValue, uint prev, uint next, uint ref, bool present);

    function remove(bytes memory key) public returns (bytes memory oldValue, uint prev, uint next, uint ref, bool present);

    function isEmpty() public view returns (bool);
}