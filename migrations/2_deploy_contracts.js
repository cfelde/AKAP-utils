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
const domainManager = artifacts.require("DomainManager");
const forTestA = artifacts.require("ForTestA");
const forTestB = artifacts.require("ForTestB");

function akapAddress(network) {
    let officialAddress = "0xaacCAAB0E85b1EfCEcdBA88F4399fa6CAb402349";
    let testNetworkAddress = "REPLACE ME WITH YOUR TESTNET AKAP ADDRESS";

    switch(network) {
        case "goerli": return officialAddress;
        case "rinkeby": return officialAddress;
        case "kovan": return officialAddress;
        case "ropsten": return officialAddress;
        case "mainnet": return officialAddress;
        default: return testNetworkAddress;
    }
}

module.exports = function(deployer, network, accounts) {
    deployer.deploy(convertUtils);
    deployer.deploy(domainManager, akapAddress(network), [0x0], web3.utils.toHex(new Date().getTime()))
    deployer.deploy(forTestA);
    deployer.deploy(forTestB);
};
