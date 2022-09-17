
var Test = require('./config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
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
        try {
            await config.flightSurety.setTestingMode(true);
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

    // it('(airline) Fund an airline', async () => {
    //     // ARRANGE
    //     let amount = web3.utils.toWei("10", "ether");

    //     // ACT
    //     try {
    //         response = await config.flightSuretyApp.fundAirline(config.firstAirline, amount, { from: config.firstAirline, gas: 300000 });
    //     }
    //     catch (e) {
    //         console.log("funding error: ", e)
    //     }

    //     let result = await config.flightSuretyData.isAirlineFunded.call(config.firstAirline, { from: config.firstAirline, gas: 3000000, gasPrice: 500000000 });
    //     // console.log(result)
    //     // console.log(response)

    //     // ASSERT
    //     assert.equal(result, true, "Airline should be funded");

    // });

    it('(airline) can register an Airline using registerAirline() if is funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];
        let result;
        let amount = web3.utils.toWei("10", "ether");


        config.flightSuretyApp.fundAirline(config.firstAirline, amount, { from: config.firstAirline, gas: 5000000, gasPrice: 500000000 })
            .on('error', (e) => { console.log("fund error ", e) })
            .then((receipt) => {
                console.log("fund receipt", receipt)
            })
            .catch((e) => { "fund error", console.log(e) });

        // ACT
        config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline, gas: 5000000, gasPrice: 500000000 })
            .on('error', (e) => { console.log("register error ", e) })
            .then((receipt) => {
                console.log("register receipt", receipt)
            })
            .catch((e) => { console.log("register error ", e) });


        result = await config.flightSuretyData.isAirlineRegistered.call(newAirline, { from: config.firstAirline, gas: 5000000, gasPrice: 500000000 });

        // ASSERT
        assert.equal(result, true, "Airline should be registred when funded");
    });
});
