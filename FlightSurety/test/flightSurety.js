
var Test = require('./config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        console.log(web3.version)
        web3.eth.handleRevert = true
        config = await Test.Config(accounts);
        console.log(config.flightSuretyData.address)
        console.log(config.flightSuretyApp.address)

        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyApp.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        let newAirline = accounts[2];

        try {
            await config.flightSuretyData.registerAirline(newAirline, { from: config.firstAirline });
        }
        catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });
        }
        catch (e) {

        }
        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('(airline) Fund an airline with less than 10 ether', async () => {
        // ARRANGE
        let amount = web3.utils.toWei("5", "ether");

        await config.flightSuretyApp.fundAirline(config.firstAirline, amount, { from: config.firstAirline, gas: 100000 })
            // .on('error', (e) => { console.log("funding error: ", e) })
            .then((response) => { console.log("Response received") })
            .catch((err) => { })

        let result = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline);

        // ASSERT
        assert.equal(result, false, "Airline must pay > 10 ether for funding");

    });

    it('(airline) Fund an airline with 10 ether', async () => {
        // ARRANGE
        let amount = web3.utils.toWei("10", "ether");

        // ACT
        // console.log(config.flightSuretyApp.methods)

        await config.flightSuretyApp.fundAirline(config.firstAirline, amount, { from: config.firstAirline, gas: 100000 })
            .then((response) => { console.log("Response received") })
        // .catch((err) => { console.log("funding error: ") })


        // await config.flightSuretyData.setOperatingStatus(true)
        //     .then((response) => { console.log("Response received") })
        //     .catch((err) => { console.log("funding error: ", err) })

        let result = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline);
        // console.log(result)
        // console.log(response)

        // ASSERT
        assert.equal(result, true, "Airline should be funded");

    });


    it('(airline) can register an Airline using registerAirline() if is funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];
        let result;
        let amount = web3.utils.toWei("10", "ether");


        // config.flightSuretyApp.fundAirline(config.firstAirline, amount, { from: config.firstAirline })
        //     .then((receipt) => {
        //         console.log("fund receipt", receipt)
        //     })
        //     .catch((e) => { "fund error", console.log(e) });

        // ACT
        await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline })
            .then((receipt) => {
                console.log("register receipt", receipt.status)
            })
            .catch((e) => { console.log("register error ", e) });


        result = await config.flightSuretyData.isAirlineRegistered.call(newAirline);
        console.log("Is airlined resutl", result);
        // ASSERT
        assert.equal(result, true, "New airline should be registred when an already funded airline add them");
    });

    it('(airline) Register an airline when already four are in', async () => {
        // ARRANGE
        // 2 are already funded from previous tests
        let newAirline = accounts[2];
        let otherAirline = accounts[3];
        let anotherAirline = accounts[4];
        let amount = web3.utils.toWei("10", "ether");

        await config.flightSuretyApp.registerAirline(otherAirline, { from: config.firstAirline })
            .then((receipt) => {
                console.log("register receipt", receipt.status)
            })
            .catch((e) => { console.log("register error ", e) });

        await config.flightSuretyApp.registerAirline(anotherAirline, { from: config.firstAirline })
            .then((receipt) => {
                console.log("register receipt", receipt.status)
            })
            .catch((e) => { console.log("register error ", e) });

        await config.flightSuretyApp.fundAirline(newAirline, amount, { from: newAirline, gas: 100000 })
            .then((response) => { console.log("Response received") })

        await config.flightSuretyApp.fundAirline(otherAirline, amount, { from: otherAirline, gas: 100000 })
            .then((response) => { console.log("Response received") })

        await config.flightSuretyApp.fundAirline(anotherAirline, amount, { from: anotherAirline, gas: 100000 })
            .then((response) => { console.log("Response received") })


        let maxAirlines = 4;

        let count = await config.flightSuretyData.fundedAirlineNo.call();
        assert(count >= 4, "Funded airlines are not enough");

        for (let i = 0; i < maxAirlines; i++) {
            let multiapartyAirline = accounts[i + 5];
            let count = await config.flightSuretyData.fundedAirlineNo.call();
            let votesNeeded = Math.ceil(count / 2);
            for (let k = 0; k < votesNeeded; ++k) {
                await config.flightSuretyApp.registerAirline(multiapartyAirline, { from: accounts[k + 1] })
                    .then((receipt) => {
                        console.log("register receipt", receipt.status)
                    })
                    .catch((e) => { console.log("register error ", e) });;
                let result = await config.flightSuretyData.isAirlineRegistered.call(multiapartyAirline);
                assert.equal(result, k === (votesNeeded - 1), "multi-party consensus failed");
            }
        }




    });
});
