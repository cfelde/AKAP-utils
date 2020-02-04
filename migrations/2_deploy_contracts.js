const convertUtils = artifacts.require("ConvertUtils");
const domainManager = artifacts.require("DomainManager");

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
};
