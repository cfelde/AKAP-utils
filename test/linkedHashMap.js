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
const linkedHashMap = artifacts.require("LinkedHashMap");

contract("When using a linked hash map:", async accounts => {
    it("it is possible to encode and decode entries", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        // Create a node for the map
        await dm.claim([0x6d, 0x61, 0x70]);
        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x70]);

        // Deploy map
        let mapInstance = await linkedHashMap.new(dm.address, rootPtr);
        await registry.setSeeAddress(rootPtr, mapInstance.address);

        // Encode/Decode empty value
        let entry1 = await mapInstance.encode([], 0x11, 0x22);
        let decoded1 = await mapInstance.decode(entry1);
        assert.isNull(decoded1.value);
        assert.equal("11", decoded1.prev.toString(16));
        assert.equal("22", decoded1.next.toString(16));

        // Encode/Decode small value
        let entry2 = await mapInstance.encode([0x00, 0x01, 0x02], 0x33, 0x44);
        let decoded2 = await mapInstance.decode(entry2);
        assert.equal("0x000102", decoded2.value);
        assert.equal("33", decoded2.prev.toString(16));
        assert.equal("44", decoded2.next.toString(16));

        // Encode/Decode bigger value
        let str = "Hello World, this is a value with a bit more content in it.. 1234567890 | !\"#$%&/()=";
        let b = await cu.sToBytes(str);

        let entry3 = await mapInstance.encode(b, 0x00, web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
        let decoded3 = await mapInstance.decode(entry3);
        assert.equal(str, await cu.bToString(decoded3.value));
        assert.equal("0", decoded3.prev.toString(16));
        assert.equal("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", decoded3.next.toString(16));
    });

    it("it is possible to put and get entries", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x70]);
        let mapInstance = await linkedHashMap.at(await registry.seeAddress(rootPtr));

        // We haven't yet given the map contract write access
        // We expect this next put request to fail
        assert.isTrue(await mapInstance.isEmpty());
        await expectRevert(mapInstance.put(await cu.sToBytes("FAIL"), await cu.sToBytes("FAIL")), "DomainManager: Not approved for all");
        assert.isTrue(await mapInstance.isEmpty());
        assert.equal("0", (await mapInstance.head()).toString(16));
        assert.equal("0", (await mapInstance.tail()).toString(16));

        let entry0 = await mapInstance.get(await cu.sToBytes("FAIL"));
        assert.isNull(entry0.value);
        assert.equal("0", entry0.prev.toString(16));
        assert.equal("0", entry0.next.toString(16));
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("FAIL")));

        // Give map write access
        await dm.setApprovalForAll(mapInstance.address, true);

        // Test case:
        // First entry, new map: prev and next should be zero. Head and tail should be ref.
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key1")));
        let tx = await mapInstance.put(await cu.sToBytes("key1"), await cu.sToBytes("value A"));
        let gasUsed = tx.receipt.gasUsed;
        let entry1 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.isFalse(await mapInstance.isEmpty());
        assert.equal("value A", await cu.bToString(entry1.value));
        assert.equal("0", entry1.prev.toString(16));
        assert.equal("0", entry1.next.toString(16));
        assert.equal(entry1.ref.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(entry1.ref.toString(16), (await mapInstance.tail()).toString(16));
        assert.isTrue(await mapInstance.exists(await cu.sToBytes("key1")));

        // Test case:
        // Only one entry, update entry: prev and next should remain as zero. Head and tail are still ref.
        tx = await mapInstance.put(await cu.sToBytes("key1"), await cu.sToBytes("value B"));
        gasUsed += tx.receipt.gasUsed;
        let entry2 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("value B", await cu.bToString(entry2.value));
        assert.equal("0", entry2.prev.toString(16));
        assert.equal("0", entry2.next.toString(16));
        assert.equal(entry2.ref.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(entry2.ref.toString(16), (await mapInstance.tail()).toString(16));

        // Test case:
        // Second entry: prev should point to first entry, first entry should have next updated to ref of second entry.
        // Head is unchanged but tail points to new entry. Second entry should have zero next ref.
        tx = await mapInstance.put(await cu.sToBytes("key2"), await cu.sToBytes("value C"));
        gasUsed += tx.receipt.gasUsed;
        let entry3 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.equal("value C", await cu.bToString(entry3.value));
        assert.equal(entry2.ref.toString(16), entry3.prev.toString(16));
        assert.equal("0", entry3.next.toString(16));
        assert.equal(entry2.ref.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(entry3.ref.toString(16), (await mapInstance.tail()).toString(16));

        let entry4 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("value B", await cu.bToString(entry4.value));
        assert.equal("0", entry4.prev.toString(16));
        assert.equal(entry3.ref.toString(16), entry4.next.toString(16));

        // Test case:
        // Add in third entry and verify that we can traverse the sequence from head to tail and back with expected values.
        tx  = await mapInstance.put(await cu.sToBytes("key3"), await cu.sToBytes("value D"));
        gasUsed += tx.receipt.gasUsed;
        let entry5 = await mapInstance.get(await cu.sToBytes("key3"));
        assert.equal("value D", await cu.bToString(entry5.value));
        assert.equal(entry3.ref.toString(16), entry5.prev.toString(16));
        assert.equal("0", entry5.next.toString(16));
        assert.equal(entry1.ref.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(entry5.ref.toString(16), (await mapInstance.tail()).toString(16));

        let ref = await mapInstance.head();
        let entryCount = 0;
        do {
            let entry = await mapInstance.getByRef(ref);
            switch (entryCount) {
                case 0:
                    assert.equal("value B", await cu.bToString(entry.value));
                    break;
                case 1:
                    assert.equal("value C", await cu.bToString(entry.value));
                    break;
                case 2:
                    assert.equal("value D", await cu.bToString(entry.value));
                    break;
                default:
                    assert.isTrue(false);
            }
            entryCount++;
            ref = entry.next;
        } while (ref.toString(16) !== "0");

        ref = await mapInstance.tail();
        entryCount = 0;
        do {
            let entry = await mapInstance.getByRef(ref);
            switch (entryCount) {
                case 0:
                    assert.equal("value D", await cu.bToString(entry.value));
                    break;
                case 1:
                    assert.equal("value C", await cu.bToString(entry.value));
                    break;
                case 2:
                    assert.equal("value B", await cu.bToString(entry.value));
                    break;
                default:
                    assert.isTrue(false);
            }
            entryCount++;
            ref = entry.prev;
        } while (ref.toString(16) !== "0");

        //console.log("\tGas used: " + gasUsed);
    });

    it("it is possible to remove entries", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x70]);
        let mapInstance = await linkedHashMap.at(await registry.seeAddress(rootPtr));

        // Test case:
        // Removing an entry will link next and prev of neighboring entries.
        // It will remove the node body data of the removed entry.
        // It will not impact head or tail
        assert.isTrue(await mapInstance.exists(await cu.sToBytes("key2")));
        let entry1 = await mapInstance.get(await cu.sToBytes("key2"));
        assert.isNotNull(await registry.nodeBody(entry1.ref));

        let headRef = await mapInstance.head();
        let tailRef = await mapInstance.tail();

        let tx = await mapInstance.remove(await cu.sToBytes("key2"));
        let gasUsed = tx.receipt.gasUsed;
        assert.isFalse(await mapInstance.isEmpty());
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key2")));
        assert.isNull(await registry.nodeBody(entry1.ref));

        assert.equal(headRef.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(tailRef.toString(16), (await mapInstance.tail()).toString(16));

        let ref = await mapInstance.head();
        let entryCount = 0;
        do {
            let entry = await mapInstance.getByRef(ref);
            switch (entryCount) {
                case 0:
                    assert.equal("value B", await cu.bToString(entry.value));
                    break;
                case 1:
                    assert.equal("value D", await cu.bToString(entry.value));
                    break;
                default:
                    assert.isTrue(false);
            }
            entryCount++;
            ref = entry.next;
        } while (ref.toString(16) !== "0");

        ref = await mapInstance.tail();
        entryCount = 0;
        do {
            let entry = await mapInstance.getByRef(ref);
            switch (entryCount) {
                case 0:
                    assert.equal("value D", await cu.bToString(entry.value));
                    break;
                case 1:
                    assert.equal("value B", await cu.bToString(entry.value));
                    break;
                default:
                    assert.isTrue(false);
            }
            entryCount++;
            ref = entry.prev;
        } while (ref.toString(16) !== "0");

        // Test case:
        // Remove last entry. Last entry should be cleared, tail ref updated and prev entry next ref updated.
        assert.isTrue(await mapInstance.exists(await cu.sToBytes("key3")));
        let entry2 = await mapInstance.get(await cu.sToBytes("key3"));
        assert.isNotNull(await registry.nodeBody(entry2.ref));

        headRef = await mapInstance.head();
        tailRef = await mapInstance.tail();

        tx = await mapInstance.remove(await cu.sToBytes("key3"));
        gasUsed += tx.receipt.gasUsed;
        assert.isFalse(await mapInstance.isEmpty());
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key3")));
        assert.isNull(await registry.nodeBody(entry2.ref));

        assert.equal(headRef.toString(16), (await mapInstance.head()).toString(16));
        assert.notEqual(tailRef.toString(16), (await mapInstance.tail()).toString(16));
        assert.equal(entry2.prev.toString(16), (await mapInstance.tail()).toString(16));
        assert.equal((await mapInstance.head()).toString(16), (await mapInstance.tail()).toString(16));

        let entry3 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.equal("0", entry3.prev.toString(16));
        assert.equal("0", entry3.next.toString(16));

        // Test case:
        // Remove first entry. First entry should be cleared, head ref updated and next entry prev ref updated.
        tx = await mapInstance.put(await cu.sToBytes("key3"), await cu.sToBytes("value D"));
        gasUsed += tx.receipt.gasUsed;
        assert.isTrue(await mapInstance.exists(await cu.sToBytes("key1")));
        let entry4 = await mapInstance.get(await cu.sToBytes("key1"));
        assert.isNotNull(await registry.nodeBody(entry4.ref));

        headRef = await mapInstance.head();
        tailRef = await mapInstance.tail();

        tx = await mapInstance.remove(await cu.sToBytes("key1"));
        gasUsed += tx.receipt.gasUsed;
        assert.isFalse(await mapInstance.isEmpty());
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key1")));
        assert.isNull(await registry.nodeBody(entry4.ref));

        assert.notEqual(headRef.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(entry4.next.toString(16), (await mapInstance.head()).toString(16));
        assert.equal(tailRef.toString(16), (await mapInstance.tail()).toString(16));
        assert.equal((await mapInstance.head()).toString(16), (await mapInstance.tail()).toString(16));

        let entry5 = await mapInstance.get(await cu.sToBytes("key3"));
        assert.equal("0", entry5.prev.toString(16));
        assert.equal("0", entry5.next.toString(16));

        // Test case:
        // Remove only entry. Entry should be cleared, head and tail ref updated to zero. Map is empty.
        assert.isFalse(await mapInstance.isEmpty());
        tx = await mapInstance.remove(await cu.sToBytes("key3"));
        gasUsed += tx.receipt.gasUsed;
        assert.isTrue(await mapInstance.isEmpty());
        assert.equal("0", (await mapInstance.head()).toString(16));
        assert.equal("0", (await mapInstance.tail()).toString(16));

        //console.log("\tGas used: " + gasUsed);
    });

    it("only approved accounts can make changes", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let cu = await convertUtils.deployed();

        let rootPtr = await registry.hashOf(await dm.domain(), [0x6d, 0x61, 0x70]);
        let mapInstance = await linkedHashMap.at(await registry.seeAddress(rootPtr));

        // We haven't approved accounts[1] yet so this will fail
        await expectRevert(mapInstance.put(await cu.sToBytes("key4"), await cu.sToBytes("value E"), {from: accounts[1]}), "LinkedHashMap: Not approved for all");
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key4")));

        await expectRevert(mapInstance.remove(await cu.sToBytes("key4"), {from: accounts[1]}), "LinkedHashMap: Not approved for all");

        // Approve accounts[1]
        await dm.setApprovalForAll(accounts[1], true);

        await mapInstance.put(await cu.sToBytes("key4"), await cu.sToBytes("value E"), {from: accounts[1]});
        assert.isTrue(await mapInstance.exists(await cu.sToBytes("key4")));

        mapInstance.remove(await cu.sToBytes("key4"), {from: accounts[1]});
        assert.isFalse(await mapInstance.exists(await cu.sToBytes("key4")));
    });
});
