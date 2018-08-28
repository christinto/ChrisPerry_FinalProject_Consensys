var VehicleManager = artifacts.require("./VehicleManager.sol");

module.exports = function(deployer) {
  deployer.deploy(VehicleManager);
};