var MintableToken = artifacts.require('openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol');
var MerkleAirDrop = artifacts.require('./MerkleAirdrop.sol');
var TestDrop = artifacts.require('./TestDrop.sol');

module.exports = (deployer) => {
     deployer.deploy(MintableToken)
             .then((result) => deployer.deploy(MerkleAirDrop,MintableToken.address));
    deployer.deploy(TestDrop);        
}



