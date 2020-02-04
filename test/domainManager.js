const domainManager = artifacts.require("DomainManager");
const akap = artifacts.require("IAKAP");
const erc721 = artifacts.require("IERC721");

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
        // TODO
    });

    it("we can make claims if approved only", async () => {
        // TODO
    });

    it("we can reclaim", async () => {
        // TODO
    });
});
