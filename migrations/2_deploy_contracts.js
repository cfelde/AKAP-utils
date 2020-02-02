let convertUtils = artifacts.require("ConvertUtils");

module.exports = function(deployer) {
    deployer.deploy(convertUtils);
};
