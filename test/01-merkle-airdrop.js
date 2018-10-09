'use strict';
import {sha3, bufferToHex} from 'ethereumjs-util';

import Web3 from 'web3'
const web3 = new Web3()
const fs = require('fs');

import assertBnEq from '../test/helpers/assertBigNumbersEqual';
import MerkleTree from '../test/helpers/merkleTree';
import expectThrow from '../test/helpers/expectThrow';

const MerkleAirdrop = artifacts.require("MerkleAirdrop.sol");

const MintableToken = artifacts.require("openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol");

const l = console.log;

contract('MerkleAirdrop', function(accs) {

    const roles =  {
        owner: accs[0],
		user1: accs[1],
		user2: accs[2],
		user3: accs[3],
		user4: accs[4],
        nobody1: accs[5],
        nobody2: accs[6],
        nobody3: accs[7],
        nobody4: accs[8],
        nobody5: accs[9],
	};


	// create token contract, mint some tokens and give them to airdrop contract
	const TOTAL_TOKENS_FOR_AIRDROP = 1000000;// new BigNumber(1000);
	const NUM_TOKENS_PER_USER = 10;
	let mintableToken;
	let merkleAirdrop;
	let leafsArray = [];
	let merkleTree;
	let merkleRootHex;

	function generateLeafs(n) {
		let leafs = [];
		for(let i=0; i < n; i++) {
			let acc = web3.eth.accounts.create(""+i);
			// lowercase is important!
			leafs.push('' + acc.address.toLowerCase() + ' ' + 100 + ' ' + 1);
		}
		return leafs;
	}

   it("generates many addresses(of file optionally) for test, reads them and builds merkleTree", async function() {
   		// return true;
        this.timeout(10000);

        leafsArray = generateLeafs(4);
		leafsArray.push(roles.user1 + ' 100 1');
		leafsArray.push(roles.user2 + ' 88 1');
		leafsArray.push(roles.user3 + ' 99 1');
		leafsArray.push(roles.user4 + ' 66 1');
        merkleTree = new MerkleTree(leafsArray);
		merkleRootHex = merkleTree.getHexRoot();
		
		console.log("MerkleTreeHexRoot: ",merkleRootHex);

		// uncomment here to receive a file with addresses, similar to real file, provided by user
		// be careful with big list sizes, use concatenation to join them
        // let data = leafsArray.join("\n");
        // fs.writeFileSync(merkleRootHex, data);
	});

	it("tests deployment of airdrop contract and and initial account allocation", async function() {
		// deploy token contract, then give many tokens to deployed airdrop contract.
		mintableToken = await MintableToken.new({from: roles.owner});
		merkleAirdrop = await MerkleAirdrop.new(mintableToken.address, {from: roles.owner});
		await merkleAirdrop.setRoot(merkleRootHex);

		assert.equal(await merkleAirdrop.merkleRoot(), merkleTree.getHexRoot());

		let balBeforeAllocation = await mintableToken.balanceOf(accs[0])
		assert.equal(0,balBeforeAllocation.toNumber());

    });

 	it("tests for success mint for allowed set of users", async function() {
		// check correctness of mint for each in leafsArray

		let expectedTotalTokenSupply=0;

		for(let i = 0; i < leafsArray.length; i++) {

			// string like "0x821aea9a577a9b44299b9c15c88cf3087f3b5544 99000000"
			let leaf = leafsArray[i];

			let merkle_proof = await merkleTree.getHexProof(leaf);
			
			// await l("For string '" + leaf + "', and leaf: '" + '0x' + sha3(leaf).toString('hex') + "' generated proof: " + JSON.stringify(merkle_proof) );
			let leafSplit = leaf.split(" ");
			let userAddress = leafSplit[0];
			let numTokens = leafSplit[1];
			let nounce = leafSplit[2];
			expectedTotalTokenSupply += parseInt(numTokens);

			console.log("userAddress",userAddress);
			console.log("numTokens",numTokens);
			console.log("nounce",nounce);

			let airdropContractBalance = await mintableToken.balanceOf(merkleAirdrop.address);
			let userTokenBalance = await mintableToken.balanceOf(userAddress);

			let getTokensByMerkleProof = await merkleAirdrop.getTokensByMerkleProof(merkle_proof, userAddress, numTokens, nounce);
			let balAfterAllocation = await mintableToken.balanceOf(userAddress);
			balAfterAllocation = balAfterAllocation.toNumber();
			console.log("userBalAfterAllocation",balAfterAllocation);

			let currentMintableTokenSupply = (await mintableToken.totalSupply()).toNumber();

			console.log("currentMintableTokenSupply",currentMintableTokenSupply);
			assert.equal(numTokens, balAfterAllocation, "AirDrop Balance was successfully claimed");
			assert.equal(expectedTotalTokenSupply,currentMintableTokenSupply, "Total supply balance failed to increase");
			assert.equal(numTokens, balAfterAllocation, "AirDrop Balance was successfully claimed");
			assert.isOk(getTokensByMerkleProof, 'getTokensByMerkleProof() did not return true for a valid proof');
		}
	});


});
