//SPDX-License-Identifier: BSD
pragma solidity >=0.8.0 <=0.8.17;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Structs.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(address => bool) private authorizedCallers; //AUTHORIZED CALLERS

    // // AIRLINE DATA
    // struct Airline {
    //     // address wallet;
    //     string name;
    //     bool isRegistered;
    //     bool isFunded;
    //     uint256 funds;
    //     uint256 votes;
    // }

    mapping(address => Airline) airlines;

    uint256 public registeredAirlineNo = 0;
    uint256 public fundedAirlineNo = 0;

    // // Flight Data
    // struct Flight {
    //     bool isRegistered;
    //     bool isClosed;
    //     address airline;
    //     string flightNumber;
    //     string origin;
    //     string destination;
    //     uint256 departureTime;
    //     uint8 statusCode;
    // }

    mapping(bytes32 => Flight) public flights;
    bytes32[] public registeredFlights;
    uint256 public registeredFlightsNo = 0;

    // // passengers info
    // struct InsuranceClaim {
    //     address passengerWallet;
    //     bytes32 flightKey;
    //     uint256 purchaseAmount;
    //     uint256 payoutPercentage;
    // }

    // List of passenger enlisted passengers
    address[] public passengerAddresses;

    // Passenger Wallet: address => Insurance Claims List: InsuranceClaim
    // Stores all claims for a particular passenger
    mapping(address => InsuranceClaim[]) private passengerClaims;
    // Passenger: address => Remaining Funds: uint256
    mapping(address => uint256) public withdrawableFunds;

    // Flight: bytes32 => PassengerClaims: InsuranceClaim
    // Stores all claims for a particular Flight
    mapping(bytes32 => InsuranceClaim[]) public flightInsuranceClaims;

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() payable {
        contractOwner = msg.sender;
        authorizedCallers[msg.sender] = true;
        passengerAddresses = new address[](0);

        airlines[msg.sender] = Airline("Udacity Air", true, false, 0, 0);
        registeredAirlineNo++;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AirlineRegistered(address airline);

    event AirlineFunded(address airline);

    event FlightRegistered(bytes32 flightKey);

    event ProcessedFlightStatus(bytes32 flightKey, uint8 statusCode);

    event PassengerInsured(
        bytes32 flightKey,
        address passenger,
        uint256 amount,
        uint256 payoutPercentage
    );

    event InsureeCredited(bytes32 flightKey, address passenger, uint256 amount);

    event PayInsuree(address payoutAddress, uint256 amount);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the calling App contract has been authorized
     */
    modifier requireIsCallerAuthorized() {
        require(
            authorizedCallers[msg.sender] == true,
            "Caller is not an authorized contract"
        );
        _;
    }

    modifier requireAirlineNotRegistered(address airline) {
        require(
            !airlines[airline].isRegistered,
            "Airline is already registered"
        );
        _;
    }

    modifier requireAirlineRegistered(address airline) {
        require(airlines[airline].isRegistered, "Airline is not registered");
        _;
    }
    modifier requireAirlineFunded(address airline) {
        require(airlines[airline].isFunded, "Airline is not funded Data");
        _;
    }
    modifier requireAirlineNotFunded(address airline) {
        require(!airlines[airline].isFunded, "Airline is already funded");
        _;
    }

    modifier requireFlightIsRegistered(bytes32 flightKey) {
        require(flights[flightKey].isRegistered, "Flight is not Registerd");
        _;
    }

    modifier requireFlightIsNotClosed(bytes32 flightKey) {
        require(!flights[flightKey].isClosed, "Flight has closed");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() external view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // function registeredFlightsNo() external view returns (uint256) {
    //     return registeredFlightsNo;
    // }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(
        address newAirline,
        string memory airline_name,
        address signingAirline
    )
        external
        requireIsOperational
        requireAirlineNotRegistered(newAirline)
        requireAirlineFunded(signingAirline)
    {
        airlines[newAirline] = Airline(airline_name, true, false, 0, 0);
        registeredAirlineNo++;
        emit AirlineRegistered(newAirline);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fundAirline(address airline, uint256 amount)
        public
        payable
        requireIsOperational
        requireAirlineRegistered(airline)
        requireAirlineNotFunded(airline)
    {
        airlines[airline].funds = airlines[airline].funds.add(amount);
        airlines[airline].isFunded = true;

        fundedAirlineNo = fundedAirlineNo.add(1);

        emit AirlineFunded(airline);
    }

    function registerFlight(
        address airline,
        string memory flight_number,
        string memory origin,
        string memory destination,
        uint256 timestamp
    ) external requireIsOperational requireAirlineRegistered(airline) {
        bytes32 key = getFlightKey(airline, flight_number, timestamp);
        require(!flights[key].isRegistered, "Flight is already registered.");

        flights[key].isRegistered = true;
        flights[key].isClosed = false;
        flights[key].airline = airline;
        flights[key].flightNumber = flight_number;
        flights[key].origin = origin;
        flights[key].destination = destination;
        flights[key].departureTime = timestamp;
        flights[key].statusCode = 0;
        flights[key].flightKey = key;

        registeredFlights.push(key);
        registeredFlightsNo++;
        emit FlightRegistered(key);
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance(
        bytes32 flightKey,
        address passenger,
        uint256 amount,
        uint256 payout
    )
        external
        payable
        requireIsOperational
        requireFlightIsRegistered(flightKey)
        requireFlightIsNotClosed(flightKey)
    {
        InsuranceClaim memory claim = InsuranceClaim(
            passenger,
            flightKey,
            amount,
            payout
        );

        // require that flight has not landed
        flightInsuranceClaims[flightKey].push(claim);
        passengerClaims[passenger].push(claim);
        passengerAddresses.push(passenger);

        emit PassengerInsured(flightKey, passenger, amount, payout);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey) external requireIsOperational {
        for (uint256 i = 0; i < flightInsuranceClaims[flightKey].length; i++) {
            InsuranceClaim memory claim = flightInsuranceClaims[flightKey][i];
            //     insuranceClaim.credited = true;
            uint256 amount = claim
                .purchaseAmount
                .mul(claim.payoutPercentage)
                .div(100);

            withdrawableFunds[claim.passengerWallet] = withdrawableFunds[
                claim.passengerWallet
            ].add(amount);
            emit InsureeCredited(flightKey, claim.passengerWallet, amount);
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     */
    function pay(address payable payoutAddress)
        external
        payable
        requireIsOperational
    {
        uint256 amount = withdrawableFunds[payoutAddress];
        require(
            address(this).balance >= amount,
            "Contract has insufficient funds."
        );
        require(amount > 0, "There are no funds available for withdrawal");
        withdrawableFunds[payoutAddress] = 0;
        payoutAddress.transfer(amount);
        emit PayInsuree(payoutAddress, amount);
    }

    function isAirlineRegistered(address airline) public view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function isAirlineFunded(address airline) public view returns (bool) {
        return airlines[airline].isFunded;
    }

    function isFlightRegistered(bytes32 flightKey) public view returns (bool) {
        return flights[flightKey].isRegistered;
    }

    function hasFlightLanded(bytes32 flightKey) public view returns (bool) {
        return flights[flightKey].statusCode > 0;
    }

    function getAvailableFlights() external view returns (Flight[] memory) {
        Flight[] memory ret = new Flight[](registeredFlightsNo);
        for (uint256 i = 0; i < registeredFlightsNo; i++) {
            ret[i] = flights[registeredFlights[i]];
        }

        return ret;
    }

    // function getFlight()

    function isPassengerInsuredForFlight(bytes32 flightKey, address passenger)
        public
        view
        returns (bool)
    {
        InsuranceClaim[] memory insuranceClaims = flightInsuranceClaims[
            flightKey
        ];
        for (uint256 i = 0; i < insuranceClaims.length; i++) {
            if (insuranceClaims[i].passengerWallet == passenger) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {}

    receive() external payable {}
}
