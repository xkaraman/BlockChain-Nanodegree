import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';

import Config from './config.json';
import Web3 from 'web3';
const myWeb3 = require("web3");

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        // console.log(config)
        this.firstAirline = config.firstAirline;
        console.log("0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef");

        console.log("Owner- Airline 1", "0x627306090abaB3A6e1400e9345bC60c78a8BEf57");
        console.log("Airline 2: ", "0xf17f52151EbEF6C7334FAD080c5704D77216b732");
        console.log("Airline 3: ", "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef");
        console.log("Airline 4: ", "0x821aEa9a577a9b44299B9c15c88cf3087F3b5544");

        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(Web3.givenProvider || config.url);
        console.log(web3);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.fsData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }

    async initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];


            let counter = 1;

            // First five accounts are airline accounts 
            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            // Next five are passengerd
            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    async isOperational(callback) {
        let self = this;
        await self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner, gas: 100000 }, callback);
    }

    async registerAirline(airline, airline_name, callback) {
        console.log("register click")
        var registeredAirline = ethereum.selectedAddress
        console.log("to be registered ", airline)

        console.log("registered ", registeredAirline)

        let self = this;
        await self.flightSuretyApp.methods
            .registerAirline(airline, airline_name)
            .send({ from: registeredAirline }, (error, result) => {
                callback(error, airline)
            })

        // let registered = await self.fsData.methods
        //     .isAirlineRegistered(airline)
        //     .call((error, result) => {
        //         callback(error, registered)
        //     });

        // console.log(registered)
    }


    async fundAirline(callback) {
        console.log("Fund click")
        var registeredAirline = ethereum.selectedAddress
        console.log("funding: ", registeredAirline)

        let amount = myWeb3.utils.toWei("11", "ether");

        let self = this;
        await self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: registeredAirline, value: amount, gas: 6721975, gasPrice: 2000000000 }, (error, result) => {
                callback(error, result)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    async registerFlight(flight_number, origin, destination, timestamp, callback) {
        var registeredAirline = ethereum.selectedAddress

        let self = this;
        await self.flightSuretyApp.methods
            .registerFlight(flight_number, origin, destination, timestamp)
            .send({ from: registeredAirline }, (error, result) => {
                callback(error, result)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    async buyFlightInsurance(flightKey, insuredAmount, callback) {
        var passenger = ethereum.selectedAddress
        insuredAmount = myWeb3.utils.toWei(insuredAmount, "ether");
        console.log("Insurance amount(contract): ", insuredAmount);
        let self = this;
        await self.flightSuretyApp.methods
            .buyInsurance(flightKey)
            .send({ from: passenger, value: insuredAmount })
            .then((result) => {
                callback("", result)
            })
            //  (err, result) => {
            //     callback(err, result)
            // })
            .catch((err) => {
                callback(err.message, "")
                console.log("Buy insurance failed(contract):", err)
            })

    }

    async getPassengerInsuranceBalance(flightKey, callback) {
        var caller = ethereum.selectedAddress

        let self = this;
        // let flightkey = "0xcc28cd0dc617e6c2477bc013b9e0f73e490fb27ab99a7519fc99b8e8d1afdbfe"
        // await self.fsData.methods
        //     .creditInsurees(flightkey)
        //     .send({ from: caller }, (error, result) => {
        //         console.log("Credited: ", result)
        //     })
        // console.log(tx)

        await self.fsData.methods
            .flightInsuranceClaims(flightKey, 0)
            .call({ from: caller }, (error, result) => {
                console.log("Flight Insurance claim: ", result)
                // callback(error, result)
            })

        await self.fsData.methods
            .withdrawableFunds(caller)
            .call({ from: caller }, (error, result) => {
                console.log("Withdrable Funds: ", result)
                callback(error, result)
            })
    }


    async withdrawPassengerInsuranceBalance(callback) {
        var caller = ethereum.selectedAddress

        let self = this;

        await self.fsData.methods
            .pay(caller)
            .send({ from: caller }, (error, result) => {
                console.log("Pay: ", result)
                callback(error, result)
            })

        await self.fsData.methods
            .withdrawableFunds(caller)
            .call({ from: caller }, (error, result) => {
                console.log("Withdrable Funds: ", result)
                // callback(error, result)
            })
    }
    async getAirlineNumber(callback) {
        var caller = ethereum.selectedAddress

        let self = this;

        await self.fsData.methods
            .registeredAirlineNo()
            .call({ from: caller }, (error, result) => {
                callback(error, result)

            })
    }


    async getAvailableFlightsNo() {
        var caller = ethereum.selectedAddress

        let self = this;

        return await self.fsData.methods
            .registeredFlightsNo()
            .call({ from: caller, gas: 6721975 })
        // .then((result) => { console.log("Contract.js:", result); return result })
        // .catch((err) => { return err })
    }

    async getAvailableFlights(callback) {
        var caller = ethereum.selectedAddress

        let self = this;

        this.flights = await self.flightSuretyApp.methods
            .getAvailableFlights()
            .call({ from: caller }, (error, result) => {
                console.log("Available Flights: ", result)
                callback(error, result)
            });

    }

    async getAvailableFlights() {
        var caller = ethereum.selectedAddress

        let self = this;

        self.flights = await self.flightSuretyApp.methods
            .getAvailableFlights()
            .call({ from: caller }, (error, result) => {
                console.log("Available Flights: ", result)
            });

        return self.flights
    }

    async isAirlineRegistered(callback) {
        var registeredAirline = ethereum.selectedAddress
        console.log("registered? ", registeredAirline)

        let self = this;

        await self.fsData.methods
            .isAirlineRegistered(registeredAirline)
            .call({ from: registeredAirline }, (error, result) => {
                callback(error, result)
            })

    }

    async isAirlineFunded(callback) {
        var registeredAirline = ethereum.selectedAddress
        console.log("funded? ", registeredAirline)

        let self = this;

        await self.fsData.methods
            .isAirlineFunded(registeredAirline)
            .call({ from: registeredAirline }, (error, result) => {
                callback(error, result)
            })

    }

    async fetchFlightStatus(flight, callback) {
        let self = this;
        let registeredAirline = ethereum.selectedAddress
        let payload = {
            airline: flight.airlineAddress,
            flight: flight.flightNumber,
            timestamp: flight.timestamp
        }

        await self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: registeredAirline }, (error, result) => {
                console.log("Fetching infomation:")
                callback(error, payload);
            });
    }
}