//SPDX-License-Identifier: BSD
pragma solidity >=0.8.0 <=0.8.17;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(address => bool) AuthorizedCallers; //AUTHORIZED CALLERS

    // AIRLINE DATA
    struct Airline {
        bool isRegistered;
        bool isFund;
        uint256 funds;

        // string airlineName;
    }

    uint256 registeredAirlineNo = 0;
    uint256 fundedAirlineNo = 0;

    mapping(address => Airline) airlines;

    // Flight Data
    struct Flight {
        bool isRegistered;
        bool isClose;
        // Possibly not needed
        bytes32 flightKey;
        //

        address airline;
        string flightNumber;
        uint256 departureTime;
        uint8 statusCode;
        string origin;
        string destination;
    }

    mapping(bytes32 => Flight) flights;
    bytes32[] public registeredFlights;

    struct InsuranceClaim {
        address passenger;
        uint256 purchaseAmount;
        uint256 payoutPercentage;
        bool credited;
    }

    mapping(bytes32 => InsuranceClaim[]) public flightInsuranceClaims;

    mapping(address => uint256) public withdrawableFunds;

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address ownerAirline) payable {
        contractOwner = msg.sender;
        airlines[ownerAirline] = Airline(true, false, 0);
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
        uint256 payout
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
     * @dev Modifier that requires the at least 10 ether
     */
    modifier requireAirlineFee(uint256 amount) {
        require(amount >= (10 ether), "At least 10 ether required");
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
        require(airlines[airline].isFund, "Airline is not funded Data");
        _;
    }
    modifier requireAirlineNotFunded(address airline) {
        require(!airlines[airline].isFund, "Airline is already funded");
        _;
    }

    modifier requireFlightIsRegistered(bytes32 flightKey) {
        require(flights[flightKey].isRegistered, "Flight is not Registerd");
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

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address newAirline)
        external
        requireIsOperational
        requireAirlineNotRegistered(newAirline)
        requireAirlineFunded(msg.sender)
    {
        airlines[newAirline] = Airline(true, false, 0);
        registeredAirlineNo = registeredAirlineNo.add(1);
        emit AirlineRegistered(newAirline);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fundAirline(address airline, uint256 amount)
        external
        payable
        requireIsOperational
        requireAirlineRegistered(airline)
        requireAirlineNotFunded(airline)
        requireAirlineFee(amount)
    {
        airlines[airline].funds = airlines[airline].funds.add(amount);
        airlines[airline].isFund = true;
        fundedAirlineNo = fundedAirlineNo.add(1);

        emit AirlineFunded(airline);
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
    {
        // require that flight has not landed
        flightInsuranceClaims[flightKey].push(
            InsuranceClaim(passenger, amount, payout, false)
        );
        emit PassengerInsured(flightKey, passenger, amount, payout);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey) external requireIsOperational {
        for (uint256 i = 0; i < flightInsuranceClaims[flightKey].length; i++) {
            InsuranceClaim memory insuranceClaim = flightInsuranceClaims[
                flightKey
            ][i];
            insuranceClaim.credited = true;
            uint256 amount = insuranceClaim
                .purchaseAmount
                .mul(insuranceClaim.payoutPercentage)
                .div(100);
            withdrawableFunds[insuranceClaim.passenger] = withdrawableFunds[
                insuranceClaim.passenger
            ].add(amount);
            emit InsureeCredited(flightKey, insuranceClaim.passenger, amount);
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

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function isAirlineRegistered(address airline) public view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function isAirlineFunded(address airline) public view returns (bool) {
        return airlines[airline].isFund;
    }

    function isFlightRegistered(bytes32 flightKey) public view returns (bool) {
        return flights[flightKey].isRegistered;
    }

    function hasFlightLanded(bytes32 flightKey) public view returns (bool) {
        return flights[flightKey].statusCode > 0;
    }

    function isPassengerInsuredForFlight(bytes32 flightKey, address passenger)
        public
        view
        returns (bool)
    {
        InsuranceClaim[] memory insuranceClaims = flightInsuranceClaims[
            flightKey
        ];
        for (uint256 i = 0; i < insuranceClaims.length; i++) {
            if (insuranceClaims[i].passenger == passenger) {
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
