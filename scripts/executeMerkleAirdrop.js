const MerkleAirDrop = artifacts.require('./MerkleAirdrop.sol');
const abiDecoder = require('abi-decoder');
const MerkleTree = require('../test/helpers/merkleTree.js');

var contract = require("truffle-contract");
var MerkleAirdropData = require("../build/contracts/MerkleAirDrop.json");
var MerkleAirdrop = contract(MerkleAirdropData);

module.exports = async function(callback) {
    
    

    async function executeScript (){
        console.log("test1");
        eth = web3.eth;
        accs = web3.eth.accounts;
        leafsArray = [];
        leafsArray.push(accs[0] + ' 100 1');
        leafsArray.push(accs[1] + ' 88 1');
        leafsArray.push(accs[2] + ' 99 1');
        leafsArray.push(accs[3]+ ' 66 1');
        merkleTree = new MerkleTree(leafsArray);
        merkleProof = merkleTree.getHexProof(leafsArray[0]);
        //console.log(MerkleAirdrop);
        test2 = await MerkleAirdrop.deployed();
        console.log(test2);


    /*


    await abiDecoder.addABI(MerkleAirdrop.abi);        
    
    eth = web3.eth;
    console.log("test2");

    accs = web3.eth.accounts;
    console.log("test3");
    leafsArray = [];
    leafsArray.push(accs[0] + ' 100 1');
    leafsArray.push(accs[1] + ' 88 1');
    leafsArray.push(accs[2] + ' 99 1');
    leafsArray.push(accs[3]+ ' 66 1');
    console.log("test");
    MerkleTree = await require('./test/helpers/merkleTree.js')
    merkleTree = new MerkleTree(leafsArray);
    merkleProof = merkleTree.getHexProof(leafsArray[0]);
    console.log("test");

    merkleDrop = MerkleAirdrop.at(MerkleAirdrop.address);
    merkleDrop.setRoot(merkleTree.getHexRoot());

    mintToken = MintableToken.at(MintableToken.address);
    mintToken.balanceOf(accs[0])

    txHash = merkleDrop.getTokensByMerkleProof(merkleProof, accs[0], 100,1);
    txHash.then((x)=>{txHash=x.tx});
    txHashR = eth.getTransactionReceipt(txHash);

    der = abiDecoder.decodeLogs(txHashR.logs);
    console.log("Logs:");
    console.log(der[0].events)
        */
    }

     executeScript();

}

 
    //console.error(MerkleAirDrop.abi);


    /*
    const testFolder = './build/contracts';
    const fs = require('fs');

    fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        name = file.split(".")[0];
        name = artifacts.require('./'+name+'.sol');
    });
    })*/