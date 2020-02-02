const convertUtils = artifacts.require("ConvertUtils");

contract("When doing conversions, it:", async accounts => {
    it("is possible to convert between bytes and string", async () => {
        let cu = await convertUtils.deployed();

        let b = await cu.s2bytes("Hello");
        let s = await cu.b2string(b);

        assert.equal("Hello", s);
    });

    it("is possible to convert between bytes and uint256", async () => {
        let cu = await convertUtils.deployed();

        let b = await cu.x2bytes(1234567890);
        let x = await cu.b2uint256(b);

        assert.equal("1234567890", x.toString(10));
    });
});