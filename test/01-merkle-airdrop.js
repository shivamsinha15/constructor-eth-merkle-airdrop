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

	function LeafObj(address,numTokens,nounce) {
		this.address = address;
		this.allocatedTokens = numTokens;
		this.nounce = nounce
	}

	LeafObj.prototype.toString = function()
	{
		return '' + this.address + ' ' + this.allocatedTokens + ' ' + this.nounce;
	}
	
	function convertToString(leafValues){
		let leafStringArray =  Array.from(leafValues).map((leafObj)=>{
			return leafObj.toString();
		});
		return leafStringArray;
	}

	// create token contract, mint some tokens and give them to airdrop contract
	let mintableToken;
	let merkleAirdrop;
	let leafMap = new Map();
	let merkleTree;
	let merkleRootHex;

	function generateLeafs(n) {
		let numTokens = 100;
		let nounce = 1;
		for(let i=0; i < n; i++) {
			let address = web3.eth.accounts.create(""+i).address.toLowerCase();
			let leafObj = new LeafObj(address,numTokens,nounce);
			leafMap.set(address,leafObj);
		}
		return leafMap;
	}

   it("generates many addresses(of file optionally) for test, reads them and builds merkleTree", async function() {
   		// return true;
        this.timeout(10000);

		leafMap = generateLeafs(4);
		leafMap.set(roles.user1,new LeafObj(roles.user1,100,1));
		leafMap.set(roles.user2,new LeafObj(roles.user2,88,1));
		leafMap.set(roles.user3,new LeafObj(roles.user3,99,1));
		leafMap.set(roles.user4,new LeafObj(roles.user4,66,1));

        merkleTree = new MerkleTree(convertToString(leafMap.values()));
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

		let leafKeys = leafMap.keys();
		for(let i = 0; i < leafKeys.length; i++) {

			// MapObj like "0x821aea9a577a9b44299b9c15c88cf3087f3b5544 100 1"
			let leaf = leafMap.get(leafKeys[i])

			let merkle_proof = await merkleTree.getHexProof(leaf.toString());
			
			// await l("For string '" + leaf + "', and leaf: '" + '0x' + sha3(leaf).toString('hex') + "' generated proof: " + JSON.stringify(merkle_proof) );
			let userAddress = leaf.address;
			let allocatedTokens = leaf.allocatedTokens;
			let nounce = leaf.nounce;

			expectedTotalTokenSupply += parseInt(allocatedTokens);

			console.log("userAddress",userAddress);
			console.log("allocatedTokens",allocatedTokens);
			console.log("nounce",nounce);

			let airdropContractBalance = await mintableToken.balanceOf(merkleAirdrop.address);
			let userTokenBalance = await mintableToken.balanceOf(userAddress);

			let getTokensByMerkleProof = await merkleAirdrop.getTokensByMerkleProof(merkle_proof, userAddress, allocatedTokens, nounce);
			let balAfterClaimedToken = await mintableToken.balanceOf(userAddress);
			balAfterClaimedToken = balAfterClaimedToken.toNumber();
			console.log("userBalAfterClaimedToken",balAfterClaimedToken);

			let currentMintableTokenSupply = (await mintableToken.totalSupply()).toNumber();

			console.log("currentMintableTokenSupply",currentMintableTokenSupply);
			assert.equal(allocatedTokens, balAfterClaimedToken, "AirDrop Balance was successfully claimed");
			assert.equal(expectedTotalTokenSupply,currentMintableTokenSupply, "Total supply balance failed to increase");
			assert.equal(allocatedTokens, balAfterClaimedToken, "AirDrop Balance was successfully claimed");
			assert.isOk(getTokensByMerkleProof, 'getTokensByMerkleProof() did not return true for a valid proof');

		
		}
	});


	it("test using the same nounce", async function() {
		let leaf = leafMap.get(roles.user1)
		let userAddress = leaf.address;
		let allocatedTokens = leaf.allocatedTokens;
		let nounce = leaf.nounce;
		let merkle_proof = await merkleTree.getHexProof(leaf.toString());

		let userTokenBalance = await mintableToken.balanceOf(userAddress);
		console.log("userTokenBalance", userTokenBalance.toNumber());

		let getTokensByMerkleProof = await merkleAirdrop.getTokensByMerkleProof(merkle_proof, userAddress, allocatedTokens, nounce);
		let balAfterClaimedToken = await mintableToken.balanceOf(userAddress);
		balAfterClaimedToken = balAfterClaimedToken.toNumber();
		console.log("userBalAfterClaimedToken",balAfterClaimedToken);

		assert.equal(allocatedTokens,balAfterClaimedToken);
		await expectThrow(merkleAirdrop.getTokensByMerkleProof(merkle_proof, userAddress, allocatedTokens, nounce), 'claiming rest of tokens by not owner did not broke call');
	
	});

/*	
	it("test using the different nounce", async function() {	
		let leaf = new LeafObj(roles.user1,95,2);
		let userAddress = leaf.address;
		let allocatedTokens = leaf.allocatedTokens;
		let nounce = leaf.nounce;
		let merkle_proof = await merkleTree.getHexProof(leaf.toString());



			expectedTotalTokenSupply += parseInt(allocatedTokens);

			console.log("userAddress",userAddress);
			console.log("allocatedTokens",allocatedTokens);
			console.log("nounce",nounce);

			let airdropContractBalance = await mintableToken.balanceOf(merkleAirdrop.address);
			let userTokenBalance = await mintableToken.balanceOf(userAddress);

			let getTokensByMerkleProof = await merkleAirdrop.getTokensByMerkleProof(merkle_proof, userAddress, allocatedTokens, nounce);
			let balAfterAllocation = await mintableToken.balanceOf(userAddress);
			balAfterAllocation = balAfterAllocation.toNumber();
			console.log("userBalAfterAllocation",balAfterAllocation);

			let currentMintableTokenSupply = (await mintableToken.totalSupply()).toNumber();

			console.log("currentMintableTokenSupply",currentMintableTokenSupply);
			assert.equal(allocatedTokens, balAfterAllocation, "AirDrop Balance was successfully claimed");
			assert.equal(expectedTotalTokenSupply,currentMintableTokenSupply, "Total supply balance failed to increase");
			assert.equal(allocatedTokens, balAfterAllocation, "AirDrop Balance was successfully claimed");
			assert.isOk(getTokensByMerkleProof, 'getTokensByMerkleProof() did not return true for a valid proof');

	});
*/
	




});
