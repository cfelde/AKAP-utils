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

contract IDomainManager {
    function akap() public view returns (IAKAP);

    function erc721() public view returns (IERC721);

    function domainParent() public view returns (uint);

    function domainLabel() public view returns (bytes memory);

    function domain() public view returns (uint);

    function setApprovalForAll(address to, bool approved) public;

    function claim(bytes memory label) public returns (uint status);

    function claim(uint parentId, bytes memory label) public returns (uint);

    function reclaim() public returns (uint);
}
