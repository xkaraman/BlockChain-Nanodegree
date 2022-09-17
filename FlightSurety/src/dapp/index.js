
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        renderFlightComboboxSelection(contract);

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
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







