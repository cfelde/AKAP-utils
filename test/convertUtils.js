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

const convertUtils = artifacts.require("ConvertUtils");

contract("When doing conversions, it:", async accounts => {
    it("is possible to convert between bytes and string", async () => {
        let cu = await convertUtils.deployed();

        let b = await cu.sToBytes("Hello");
        let s = await cu.bToString(b);

        assert.equal("Hello", s);
    });

    it("is possible to convert between bytes and uint8", async () => {
        let cu = await convertUtils.deployed();

        let b0 = await cu.uint8ToBytes(web3.utils.toBN("0x0"));
        let x0 = await cu.bToUint8(b0);

        assert.equal(web3.utils.toBN("0x0").toString(10), x0.toString(10));
        assert.equal("0x00".length, b0.length);

        let b1 = await cu.uint8ToBytes(web3.utils.toBN("0xf"));
        let x1 = await cu.bToUint8(b1);

        assert.equal(web3.utils.toBN("0xf").toString(10), x1.toString(10));
        assert.equal("0x0f".length, b1.length);

        let b2 = await cu.uint8ToBytes(web3.utils.toBN("0xff"));
        let x2 = await cu.bToUint8(b2);

        assert.equal(web3.utils.toBN("0xff").toString(10), x2.toString(10));
        assert.equal("0xff".length, b1.length);
    });

    it("is possible to convert between bytes and uint160", async () => {
        let cu = await convertUtils.deployed();

        let b0 = await cu.uint160ToBytes(web3.utils.toBN("0x0"));
        let x0 = await cu.bToUint160(b0);

        assert.equal(web3.utils.toBN("0x0").toString(10), x0.toString(10));
        assert.equal("0x0000000000000000000000000000000000000000".length, b0.length);

        let b1 = await cu.uint160ToBytes(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffff"));
        let x1 = await cu.bToUint160(b1);

        assert.equal(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffff").toString(10), x1.toString(10));
        assert.equal("0x00ffffffffffffffffffffffffffffffffffffff".length, b1.length);

        let b2 = await cu.uint160ToBytes(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffff"));
        let x2 = await cu.bToUint160(b2);

        assert.equal(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffff").toString(10), x2.toString(10));
        assert.equal("0xffffffffffffffffffffffffffffffffffffffff".length, b1.length);
    });


    it("is possible to convert between bytes and uint256", async () => {
        let cu = await convertUtils.deployed();

        let b0 = await cu.uint256ToBytes(web3.utils.toBN("0x0"));
        let x0 = await cu.bToUint256(b0);

        assert.equal(web3.utils.toBN("0x0").toString(10), x0.toString(10));
        assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000".length, b0.length);

        let b1 = await cu.uint256ToBytes(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
        let x1 = await cu.bToUint256(b1);

        assert.equal(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").toString(10), x1.toString(10));
        assert.equal("0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".length, b1.length);

        let b2 = await cu.uint256ToBytes(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
        let x2 = await cu.bToUint256(b2);

        assert.equal(web3.utils.toBN("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").toString(10), x2.toString(10));
        assert.equal("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".length, b1.length);
    });

    it("is possible to convert between bytes and bool", async () => {
        let cu = await convertUtils.deployed();

        let b0 = await cu.boolToBytes(false);
        let x0 = await cu.bToBool(b0);

        assert.isFalse(x0);
        assert.equal("0x00".length, b0.length);

        let b1 = await cu.boolToBytes(true);
        let x1 = await cu.bToBool(b1);

        assert.isTrue(x1);
        assert.equal("0x01".length, b1.length);
    });
});