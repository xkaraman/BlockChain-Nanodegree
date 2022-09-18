
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


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

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        // renderFlightComboboxSelection(contract);

        // User-submitted transaction
        DOM.elid('submit-airline').addEventListener('click', () => {
            // Write transaction
            let airline = (DOM.elid('airline_address').value);

            // var airline = ethereum.selectedAddress
            console.log("account idnex.js", airline)

            contract.registerAirline(airline, (error, result) => {
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
                console.log(error);
                display('Airline Registration', 'Is funded',
                    [{ label: airline, error: error, value: result }]);
            });
        })
        // User-submitted transaction
        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = parseInt(DOM.elid('flight-selection').value);

            // Write transaction
            contract.buyFlightInsurance(flight, (error, result) => {
                display('Flight Insurance', 'Buy flight insurance for 1 eth',
                    [{ label: 'Buy Status', error: error, value: result.flight + ' ' + result.timestamp }]);
            });
        })

        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = parseInt(DOM.elid('flight-selection').value);
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp }]);
            });
        })

    });


})();


function renderFlightComboboxSelection(contract) {
    let flightSelectionDiv = DOM.elid("flight-selection");

    for (let idx = 0; idx < contract.flights.length; idx++) {
        flightSelectionDiv.appendChild(DOM.option({ 'value': "" + idx }, contract.getFlightDescriptionByIdx(idx)));
    }
}

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







