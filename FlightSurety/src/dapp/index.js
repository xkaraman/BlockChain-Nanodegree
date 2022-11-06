import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Web3 from 'web3';


(async () => {

    let result = null;

    const ethereumButton = document.querySelector('.enableEthereumButton');
    const showAccount = document.querySelector('.showAccount');


    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
    }

    ethereumButton.addEventListener('click', () => {
        getAccount();
    });

    async function getAccount() {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        showAccount.innerHTML = account;
    }

    self.flights = [];

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        populateFlights();

        // User-submitted transaction
        DOM.elid('submit-airline').addEventListener('click', () => {
            // Write transaction
            let airline = (DOM.elid('airline_address').value);
            let airline_name = (DOM.elid('airline_name').value);

            // var airline = ethereum.selectedAddress
            console.log("account index.js", airline)

            contract.registerAirline(airline, airline_name, (error, result) => {
                display('Airline Registration', 'Register status',
                    [{ label: 'Airline', error: error, value: result }]);
            });
        })

        // User-submitted transaction
        DOM.elid('fund-airlines').addEventListener('click', () => {
            // Write transaction
            // let airline = (DOM.elid('airline_address').value);

            // var airline = ethereum.selectedAddress
            // console.log("account idnex.js", airline)

            contract.fundAirline((error, result) => {
                console.log(error)
                display('Airline Registration', 'Fund status',
                    [{ label: 'Airline', error: error, value: result }]);
            });
        })

        DOM.elid('is-registered').addEventListener('click', () => {
            // Write transaction
            // let airline = (DOM.elid('airline_address').value);

            var airline = ethereum.selectedAddress
            // console.log("account idnex.js", airline)

            contract.isAirlineRegistered((error, result) => {
                display('Airline Registration', 'Is registered',
                    [{ label: airline, error: error, value: result }]);
            });
        })

        DOM.elid('is-funded').addEventListener('click', () => {
            // Write transaction
            // let airline = (DOM.elid('airline_address').value);

            var airline = ethereum.selectedAddress
            // console.log("account idnex.js", airline)

            contract.isAirlineFunded((error, result) => {
                // console.log(error);
                display('Airline Registration', 'Is funded',
                    [{ label: airline, error: error, value: result }]);
            });
        })

        DOM.elid('airlines-registered').addEventListener('click', () => {
            // Write transaction
            // let airline = (DOM.elid('airline_address').value);

            var airline = ethereum.selectedAddress
            // console.log("account idnex.js", airline)

            contract.getAirlineNumber((error, result) => {
                // console.log(error)
                console.log(result);
                // display('Airline Registration', 'Is funded',
                //     [{ label: airline, error: error, value: result }]);
                if (result) {
                    DOM.elid('noOfArilines').value = result;
                }
            });
        })


        // Flights
        DOM.elid('submit_flight').addEventListener('click', () => {
            let flight_number = (DOM.elid('flight_number').value);
            let flight_origin = (DOM.elid('flight_origin').value);
            let flight_destination = (DOM.elid('flight_destination').value);

            let timestamp = Math.floor(Date.now() / 1000);
            // Write transaction
            contract.registerFlight(flight_number, flight_origin, flight_destination, timestamp, (error, result) => {
                display('Flight Registration', 'Airline registered a Flight',
                    [{ label: 'Flight Registration Status', error: error, value: [result, flight_number, flight_origin, flight_destination] }]);

                if (result) {
                    populateFlights();
                }

            });

        })

        DOM.elid('flights-registered').addEventListener('click', () => {
            // Write transaction
            // let airline = (DOM.elid('airline_address').value);

            var airline = ethereum.selectedAddress
            // console.log("account idnex.js", airline)

            contract.getAvailableFlightsNo()
                .then((result) => {
                    console.log("Result: ", result);
                    DOM.elid('noOfFlights').value = result;
                })
                .catch((error) => {
                    console.log(error)
                })
            // (error, result) => {
            //     // console.log(error)
            //     console.log(result);
            //     // display('Airline Registration', 'Is funded',
            //     //     [{ label: airline, error: error, value: result }]);
            //     if (result) {
            //         DOM.elid('noOfFlights').value = result;
            //     }
            // });
        })

        DOM.elid('flight_selection_1').addEventListener('change', () => {
            let select_element = DOM.elid('flight_selection_1').value;

            let i = 0
            for (i = 0; i < self.flights.length; i++) {
                if (select_element == self.flights[i].flightKey) {
                    console.log("found flight")
                    break
                }
            };

            DOM.elid('selected-flight-timestamp').value = self.flights[i].departureTime;
            DOM.elid('selected-flight-number').value = self.flights[i].flightNumber;
            DOM.elid('selected-airline-address').value = self.flights[i].airline;

        })

        // Passenger
        // User-submitted transaction

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let select_element = DOM.elid('flight_selection');
            let index = select_element.selectedIndex;
            let flightKey = select_element.options[index].value;

            let insuredAmount = DOM.elid('insurance_cost').value;
            console.log("Insurance amount: ", insuredAmount);
            // Write transaction
            contract.buyFlightInsurance(flightKey, insuredAmount, (error, result) => {
                display('Flight Insurance', 'Buy flight insurance for 1 eth',
                    [{ label: 'Buy Status', error: error, value: result }]);
            });

        })

        DOM.elid('get-balance').addEventListener('click', () => {
            console.log("--Get Balance--");
            let utils = Web3.utils;
            // Write transaction
            let select_element = DOM.elid('flight_selection');
            let index = select_element.selectedIndex;
            let flightKey = select_element.options[index].value;

            contract.getPassengerInsuranceBalance(flightKey, (error, result) => {
                display('Flight Insurance', 'Available Credit',
                    [{ label: 'Credit', error: error, value: result }]);

                if (result) {
                    let ethValue = utils.fromWei(utils.toBN(result), "ether")
                    DOM.elid('available_credit').value = ethValue;
                }
            });

        })

        DOM.elid('withrdaw-balance').addEventListener('click', () => {
            console.log("-- Withrdaw Balance--");
            // Write transaction
            contract.withdrawPassengerInsuranceBalance((error, result) => {
                display('Flight Insurance', 'Withrdaw Credit',
                    [{ label: 'Credit', error: error, value: result }]);

                if (result) {
                    // DOM.elid('available_credit').value = 0;
                }
            });

        })

        DOM.elid('submit-oracle').addEventListener('click', () => {
            // Find Flight info from our list
            let timestamp = DOM.elid('selected-flight-timestamp').value
            let airlineAddress = DOM.elid('selected-airline-address').value;
            let flightNumber = DOM.elid('selected-flight-number').value;

            let flight = {
                airlineAddress: airlineAddress,
                flightNumber: flightNumber,
                timestamp: timestamp
            }

            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                console.log(result)
                display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp }]);
            });
        })


        async function populateFlights() {
            // let flights = contract.getAvailableFlights((error, result) => {
            //     display('Flights', 'List of Flights', [{ label: 'Fetch Flight Status', error: error, value: result }]);
            // });
            let flightSelection = DOM.elid("flight_selection");
            let flightSelection1 = DOM.elid("flight_selection_1");

            flightSelection.length = 0;
            flightSelection.appendChild(DOM.option({ 'text': "Select Flight", 'value': "" }));

            flightSelection1.length = 0;
            flightSelection1.appendChild(DOM.option({ 'text': "Select Flight", 'value': "" }));

            self.flights = []
            contract.getAvailableFlights()
                .then((flights) => {
                    for (let idx = 0; idx < flights.length; idx++) {
                        console.log("flight key: ", flights[idx].flightKey);
                        self.flights.push(flights[idx])
                        flightSelection.appendChild(DOM.option({ 'text': flights[idx].flightNumber, 'value': flights[idx].flightKey }));
                        flightSelection1.appendChild(DOM.option({ 'text': flights[idx].flightNumber, 'value': flights[idx].flightKey }));
                    }
                    console.log(self.flights)
                })
                .catch((err) => {
                    console.log("Get Available Flights error: ", err);
                    flightSelection.appendChild(DOM.option({ 'text': "Couldn't load flights" }));
                })

        }
    });


})();




function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-10 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







