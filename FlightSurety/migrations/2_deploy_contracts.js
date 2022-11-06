const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function (deployer) {

    let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';

    const flights = [
        {
            airlineAddress: firstAirline,
            flightNumber: "SKG1231",
            departureTime: Math.floor(new Date("17 Sep 2022 15:00:00") / 1000),
            origin: "SKG",
            destination: "LCA"
        },
        {
            airlineAddress: firstAirline,
            flightNumber: "LA1234",
            departureTime: Math.floor(new Date("18 Sep 2021 15:00:00") / 1000),
            origin: "SKG",
            destination: "ATH"
        },
        {
            airlineAddress: firstAirline,
            flightNumber: "ASW124",
            departureTime: Math.floor(new Date("18 Aug 2021 17:00:00") / 1000),
            origin: "SKG",
            destination: "LCA"
        },
    ]

    deployer.deploy(FlightSuretyData)
        .then(() => {
            return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address,
                            firstAirline: firstAirline,
                            flights: flights
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
                });
        });
}