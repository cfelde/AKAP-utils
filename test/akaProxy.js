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

const domainManager = artifacts.require("DomainManager");
const akap = artifacts.require("IAKAP");
const convertUtils = artifacts.require("ConvertUtils");
const forTestA = artifacts.require("ForTestA");
const forTestB = artifacts.require("ForTestB");
const akaProxy = artifacts.require("AkaProxy");

contract("When using a contract proxy:", async accounts => {
    it("it is possible to change the implementation", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        // Create a node for the contract proxy
        // This will be used to point to the implementation
        await dm.claim([0x61, 0x6b, 0x61]);
        let rootPtr = await registry.hashOf(await dm.domain(), [0x61, 0x6b, 0x61]);

        // Create a node for eternal storage with a value
        // This is a child of rootPtr, so that the implementation can navigate to it
        let key = await cu.sToBytes("k1");
        await dm.claim(rootPtr, key);

        // Storing 0x010203 on our eternal storage location
        let eternalNode = await registry.hashOf(rootPtr, key);
        await registry.setNodeBody(eternalNode, [0x01, 0x02, 0x03]);

        // Deploy our two implementations, sharing same rootPtr
        let instanceA = await forTestA.new(registry.address, rootPtr);
        let instanceB = await forTestB.new(registry.address, rootPtr);

        // Set instanceA on rootPtr
        await registry.setSeeAddress(rootPtr, instanceA.address);

        // Deploy contract proxy
        let proxyInstance = await akaProxy.new(registry.address, rootPtr);

        // Contract looks like a ForTestA, but we're using the proxy address
        let contract = await forTestA.at(proxyInstance.address);

        assert.equal(1, await contract.value1());
        assert.equal("0x010203", await contract.value2());

        // Swap address used by proxy
        // We'll now be using instanceB through the proxy
        await registry.setSeeAddress(rootPtr, instanceB.address);

        assert.equal(2, await contract.value1());
        assert.equal("0x010203", await contract.value2());
    });
});
