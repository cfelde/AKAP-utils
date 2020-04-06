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

const {expectRevert} = require('@openzeppelin/test-helpers');
const domainManager = artifacts.require("DomainManager");
const akap = artifacts.require("IAKAP");
const convertUtils = artifacts.require("ConvertUtils");
const simpleMap = artifacts.require("SimpleMap");

contract("When using a simple map:", async accounts => {
    it("it is possible to put and get entries", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        // Create a node for the map
        await dm.claim([0x6d, 0x61, 0x71]);
        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x71]);

        // Deploy map
        let mapInstance = await simpleMap.new(dm.address, rootPtr);
        await registry.setSeeAddress(rootPtr, mapInstance.address);

        // We haven't yet given the map contract write access
        // We expect this next put request to fail
        await expectRevert(mapInstance.put(await cu.sToBytes("FAIL"), await cu.sToBytes("FAIL")), "DomainManager: Not approved for all");
        assert.isNull(await mapInstance.get(await cu.sToBytes("FAIL")));

        // Give map write access
        await dm.setApprovalForAll(mapInstance.address, true);

        // Test case:
        // Put and get by key 1
        let tx = await mapInstance.put(await cu.sToBytes("key1"), await cu.sToBytes("value A"));
        let gasUsed = tx.receipt.gasUsed;
        let entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("value A", await cu.bToString(entry1));

        // Test case:
        // Put and get by key 2, no change to key 1
        tx = await mapInstance.put(await cu.sToBytes("key2"), await cu.sToBytes("value B"));
        gasUsed = tx.receipt.gasUsed;
        entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("value A", await cu.bToString(entry1));
        let entry2 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.equal("value B", await cu.bToString(entry2));

        //console.log("\tGas used: " + gasUsed);
    });

    it("it is possible to remove entries", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x71]);
        let mapInstance = await simpleMap.at(await registry.seeAddress(rootPtr));

        // Test case:
        // Removing entries from previous test and ensure they are cleared
        let entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("value A", await cu.bToString(entry1));
        let entry2 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.equal("value B", await cu.bToString(entry2));

        await mapInstance.remove(await cu.sToBytes("key1"));

        entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.isNull(entry1);
        entry2 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.equal("value B", await cu.bToString(entry2));

        await mapInstance.remove(await cu.sToBytes("key2"));

        entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.isNull(entry1);
        entry2 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.isNull(entry2);

        //console.log("\tGas used: " + gasUsed);
    });

    it("only approved accounts can make changes", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x71]);
        let mapInstance = await simpleMap.at(await registry.seeAddress(rootPtr));

        // We haven't approved accounts[1] yet so this will fail
        await expectRevert(mapInstance.put(await cu.sToBytes("key4"), await cu.sToBytes("value E"), {from: accounts[1]}), "SimpleMap: Not approved for all");
        assert.isNull(await mapInstance.get(await cu.sToBytes("key4")));

        await expectRevert(mapInstance.remove(await cu.sToBytes("key4"), {from: accounts[1]}), "SimpleMap: Not approved for all");

        // Approve accounts[1]
        await dm.setApprovalForAll(accounts[1], true);

        await mapInstance.put(await cu.sToBytes("key4"), await cu.sToBytes("value E"), {from: accounts[1]});
        assert.equal("value E", await cu.bToString(await mapInstance.get(await cu.sToBytes("key4"))));

        mapInstance.remove(await cu.sToBytes("key4"), {from: accounts[1]});
        assert.isNull(await mapInstance.get(await cu.sToBytes("key4")));
    });
});
