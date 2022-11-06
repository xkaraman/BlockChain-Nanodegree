# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

# Running the App and Server

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`

## Make sure to have a ganache instance open (cli or GUI) or another web3 provider such as Infura. Make sure to have at least 30-40 available accounts for testing orcacles and more.

Provide the url to `truffle-config.js`

Run
`truffle compile`
`truffle migrate --reset`

## Running Dapp

In a new terminal run
`npm run dapp`

Dapp can be opened in
`http://localhost:8000/`

After connecting wallet such as Metamask, all of the actions can be complete except `Submit to Oracles` button, due to requiring the server to be running.

### Airlines
One can `Register Airline` an airline, providing their name and address, `Fund` themselves, and check if `Registered` or `Funded`.

### Flights
One can also `Submit Flight`, provinding some basic information about it and also check the number of Flights available `Flights No`.

### Passengers
A dropdown is filled with all the available flights `Select Flight` box, and one can `Buy Insurance` for the selected Flight of maximum `1 ether`.

You can also `Get Balance` to check if one is credited with some balance due to late flights and can withdraw it with `Withdraw balance` button.

### Oracles 
Finally, to run the Oracles server run:

`npm run server`

It will register upon startup 21 oracles (last 21 accounts that are connected with your wallet).

Upon Registered, one can selected a flight and `Sumbit to Oracles` to check the flight Status. 

For testing purposes now, it's always `Late`.

Finally, after submiting one can click `Get Balance` with same flight, to see they have available balance to withdraw due to the late flight.


# Udacity Readme
## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)