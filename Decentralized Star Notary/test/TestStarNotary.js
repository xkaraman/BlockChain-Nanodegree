const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

const { toBN } = web3.utils;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];

});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];

    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");

    await instance.createStar('awesome star', starId, {from: user1});
    await instance.approve(user2, starId, { from: user1, gasPrice: web3.utils.toWei("2.5", "gwei") });

    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let initial = toBN(await web3.eth.getBalance(user1));

    await instance.buyStar(starId, {from: user2, value: balance});
    
    let final = toBN(await web3.eth.getBalance(user1));
    
    let value1 = initial.add(toBN(starPrice));
    let value2 = final;
    assert.equal(value1.toString(), value2.toString());
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.approve(user2, starId, { from: user1, gasPrice: web3.utils.toWei("2.5", "gwei") });
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".001", "ether");
    let balance = web3.utils.toWei(".005", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.approve(user2, starId, { from: user1, gasPrice: web3.utils.toWei("2.5", "gwei") });
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    const initial  = toBN(await web3.eth.getBalance(user2));
    // console.log(`Initial: ${initial.toString()}`);

    const receipt = await instance.buyStar(starId, {from: user2, value: balance, gasPrice: web3.utils.toWei("2.0", "gwei")});
    // console.log(`receipt:`,receipt);

    const gasUsed = toBN(receipt.receipt.gasUsed);
    // console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

    // Obtain gasPrice from the transaction
    const tx = await web3.eth.getTransaction(receipt.tx);
    // console.log(`tx:`,tx);

    const gasPrice = toBN(tx.gasPrice);
    // console.log(`GasPrice: ${tx.gasPrice}`);

    const gasCost = gasPrice.mul(gasUsed);
    // console.log(`Gas Cost in Wei: ${gasCost}`);

    const final = toBN(await web3.eth.getBalance(user2));
    // console.log(`Final: ${final}`);
    // console.log(`Typeof: ${initial}, ${final}, ${gasCost}`);

    let value = initial.sub(final).sub(gasCost);
    // console.log(`Star price after calc: ${value}`);

    assert.equal(value.toString(), starPrice);
    assert.equal(final.toString(),initial.sub(toBN(starPrice)).sub(gasCost).toString())
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[0];
    let starId = 15;
    // 1. create a Star with different tokenId
    await instance.createStar('awesome star',starId, {from: user1});
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let name = await instance.name.call();
    let symbol = await instance.symbol.call();
    assert.equal(name, 'Udacity Star Token');
    assert.equal(symbol, 'UST');
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[0];
    let user2 = accounts[1];

    let starId1 = 19
    let starId2 = 20

    await instance.createStar("token 1", starId1,{from: user1});
    await instance.createStar("token 2", starId2,{from: user2});    
    
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.approve(user2, starId1, { from: user1, gasPrice: web3.utils.toWei("2.5", "gwei") });
    await instance.approve(user1, starId2, { from: user2, gasPrice: web3.utils.toWei("2.5", "gwei") });

    await instance.exchangeStars(starId1,starId2);
    
    // 3. Verify that the owners changed
    assert(await instance.ownerOf.call(starId1) == user2);
    assert(await instance.ownerOf.call(starId2) == user1);
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];

    let starId = 35;
    await instance.createStar("token 1", starId,{from: user1});
    await instance.approve(user2, starId, { from: user1, gasPrice: web3.utils.toWei("2.5", "gwei") });

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(user2, starId,{from: user1});
    // 3. Verify the star owner changed.
    assert(await instance.ownerOf.call(starId) == user2);

});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 36;
    await instance.createStar("token test", starId,{from: user1});

    // 2. Call your method lookUptokenIdToStarInfo
    const name = await instance.lookUptokenIdToStarInfo.call(starId);
    // 3. Verify if you Star name is the same
    assert(name,"token test");
});
