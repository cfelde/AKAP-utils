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
const erc721 = artifacts.require("IERC721");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

contract("When managing a domain:", async accounts => {
    it("we have access to a deployed domain manager", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());
        let token = await erc721.at(await dm.akap());

        // check domain address
        assert.equal(await dm.address, await registry.seeAddress(await dm.domain()));

        // check accounts[0] is approved
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isFalse(await token.isApprovedForAll(await dm.address, accounts[1]));
    });

    it("we can change who is approved", async () => {
        let dm = await domainManager.deployed();
        let token = await erc721.at(await dm.akap());

        // check only accounts[0] is approved
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isFalse(await token.isApprovedForAll(await dm.address, accounts[1]));

        await dm.setApprovalForAll(accounts[1], true);

        // check accounts[0] and account[1] is approved
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[1]));

        // Can't remove yourself
        await expectRevert(dm.setApprovalForAll(accounts[0], false), "DomainManager: Approve to caller")

        // check accounts[0] and account[1] is approved
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[1]));

        await dm.setApprovalForAll(accounts[0], false, {from: accounts[1]});

        // check only accounts[1] is approved
        assert.isFalse(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[1]));

        await dm.setApprovalForAll(accounts[0], true, {from: accounts[1]});
        await dm.setApprovalForAll(accounts[1], false);

        // check only accounts[0] is approved
        assert.isTrue(await token.isApprovedForAll(await dm.address, accounts[0]));
        assert.isFalse(await token.isApprovedForAll(await dm.address, accounts[1]));
    });

    it("we can make claims if approved only", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());

        let hash1 = await registry.hashOf(await dm.domain(), [0x0, 0x0, 0x1]);
        assert.isFalse(await registry.exists(hash1));
        await dm.claim([0x0, 0x0, 0x1]);
        assert.isTrue(await registry.exists(hash1));

        let hash2 = await registry.hashOf(hash1, [0x0, 0x0, 0x1]);
        assert.isFalse(await registry.exists(hash2));
        await dm.claim(hash1, [0x0, 0x0, 0x1]);
        assert.isTrue(await registry.exists(hash2));

        assert.equal(dm.address, await registry.ownerOf(hash1));
        assert.equal(dm.address, await registry.ownerOf(hash2));

        // Change default from account
        domainManager.defaults({from: accounts[1]});

        let hash3 = await registry.hashOf(await dm.domain(), [0x0, 0x0, 0x2]);
        assert.isFalse(await registry.exists(hash3));
        await expectRevert(dm.claim([0x0, 0x0, 0x2]), "DomainManager: Not approved for all");
        assert.isFalse(await registry.exists(hash3));

        let hash4 = await registry.hashOf(hash1, [0x0, 0x0, 0x2]);
        assert.isFalse(await registry.exists(hash4));
        await expectRevert(dm.claim(hash1, [0x0, 0x0, 0x2]), "DomainManager: Not approved for all");
        assert.isFalse(await registry.exists(hash4));

        // Revert default from account
        domainManager.defaults({from: accounts[0]});

        assert.isFalse(await registry.exists(hash3));
        await dm.claim([0x0, 0x0, 0x2]);
        assert.isTrue(await registry.exists(hash3));
    });

    it("we can reclaim from any account", async () => {
        let dm = await domainManager.deployed();
        let registry = await akap.at(await dm.akap());

        let existingExpiry1 = await registry.expiryOf(await dm.domain());
        await dm.reclaim();

        assert.isTrue(await registry.expiryOf(await dm.domain()) > existingExpiry1);

        await sleep(1000);

        let existingExpiry2 = await registry.expiryOf(await dm.domain());
        await dm.reclaim({from: accounts[2]});

        assert.isTrue(await registry.expiryOf(await dm.domain()) > existingExpiry2);
    });
});
