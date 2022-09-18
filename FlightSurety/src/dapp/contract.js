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

        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(Web3.givenProvider || config.url);
        console.log(web3);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.fsData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = config.flights;
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

    async registerAirline(airline, callback) {
        console.log("register click")
        var registeredAirline = ethereum.selectedAddress
        console.log("to be registered ", airline)

        console.log("registered ", registeredAirline)

        let self = this;
        await self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({ from: registeredAirline, gas: 100000, gasLimit: 500000 }, (error, result) => {
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

        let amount = myWeb3.utils.toWei("10", "ether");

        let self = this;
        await self.flightSuretyApp.methods
            .fundAirline(registeredAirline, amount)
            .send({ from: registeredAirline }, (error, result) => {
                callback(error, result)
            })
            .catch((err) => {
                console.log(err)
            })
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
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        await self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }
}