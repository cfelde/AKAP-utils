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

        let b = await cu.uint8ToBytes(255);
        let x = await cu.bToUint8(b);

        assert.equal("255", x.toString(10));
    });

    it("is possible to convert between bytes and uint256", async () => {
        let cu = await convertUtils.deployed();

        let b = await cu.uint256ToBytes(1234567890);
        let x = await cu.bToUint256(b);

        assert.equal("1234567890", x.toString(10));
    });

    it("is possible to convert between bytes and bool", async () => {
        let cu = await convertUtils.deployed();

        let b1 = await cu.boolToBytes(true);
        let x1 = await cu.bToBool(b1);

        assert.isTrue(x1);

        let b2 = await cu.boolToBytes(false);
        let x2 = await cu.bToBool(b2);

        assert.isFalse(x2);
    });
});