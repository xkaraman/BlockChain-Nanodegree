//SPDX-License-Identifier: BSD
pragma solidity >=0.8.0 <=0.8.17;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Account used to deploy contract
    address private contractOwner;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Insurace Constants
    uint256 AIRLINE_REGISTRATION_FEE = 10 ether;
    uint256 MAX_INSURANCE_PLAN = 1 ether;
    uint256 INSURANCE_PAYOUT = 150; // Must divide by 100 to get1.5x times the amount

    // Registration process
    uint256 AIRLINE_MIN_THRESHOLD = 4;

    bool private operational = true;

    // Airlines
    struct PendingAirline {
        bool isRegistered;
        bool isFunded;
    }

    mapping(address => PendingAirline) public pendingAirlines;

    IFlightSuretyData flightSuretyData;

    // Moved to Data contract
    // struct Flight {
    //     bool isRegistered;
    //     uint8 statusCode;
    //     uint256 updatedTimestamp;
    //     address airline;
    // }
    // mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address flightDataContract) {
        contractOwner = msg.sender;
        flightSuretyData = IFlightSuretyData(flightDataContract);
    }

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
        // Modify to call data contract's status
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
     * @dev Modifier that requires an Airline to be registered
     */
    modifier requireAirlineRegistered(address airline) {
        require(
            flightSuretyData.isAirlineRegistered(airline),
            "Airline is not registered."
        );
        _;
    }
    /**
     * @dev Modifier that requires an Airline is not registered yet
     */
    modifier requireAirlineNotRegistered(address airline) {
        require(
            !flightSuretyData.isAirlineRegistered(airline),
            "Airline is already registered."
        );
        _;
    }

    /**
     * @dev Modifier that requires an Airline to be funded
     */
    modifier requireAirlineFunded(address airline) {
        require(
            flightSuretyData.isAirlineFunded(airline),
            "Airline is not funded."
        );
        _;
    }

    /**
     * @dev Modifier that requires an Airline is not funded yet
     */
    modifier requireAirlineNotFunded(address airline) {
        require(
            !flightSuretyData.isAirlineFunded(airline),
            "Airline is already funded."
        );
        _;
    }

    modifier requireFlightRegistered(bytes32 flightKey) {
        require(
            flightSuretyData.isFlightRegistered(flightKey),
            "Flight is not registered."
        );
        _;
    }

    /**
     * @dev Modifier that requires an Flight is not registered yet
     */
    modifier requireFlightNotRegistered(bytes32 flightKey) {
        require(
            !flightSuretyData.isFlightRegistered(flightKey),
            "Flight is already registered."
        );
        _;
    }

    modifier requireFlightNotLanded(bytes32 flightKey) {
        require(
            !flightSuretyData.hasFlightLanded(flightKey),
            "Flight has already landed"
        );
        _;
    }

    /**
     * @dev Modifier that requires sufficient funding to fund an airline
     */
    modifier requireSufficientFunding(uint256 amount) {
        require(msg.value >= amount, "Insufficient Funds.");
        _;
    }

    /**
     * @dev Modifier that returns change after airline is funded
     */
    modifier calculateRefund() {
        _;
        uint256 refund = msg.value - AIRLINE_REGISTRATION_FEE;
        payable(msg.sender).transfer(refund);
    }

    modifier requirePassengerNotInsuredForFlight(
        bytes32 flightKey,
        address passenger
    ) {
        require(
            !flightSuretyData.isPassengerInsuredForFlight(flightKey, passenger),
            "Passenger is already insured for flight"
        );
        _;
    }

    modifier requireLessThanMaxInsurance() {
        require(
            msg.value <= MAX_INSURANCE_PLAN,
            "Value exceeds max insurance plan."
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return operational; // Modify to call data contract's status
    }

    /**
     * @dev Sets contract operations on/off
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
        flightSuretyData.setOperatingStatus(mode);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(address newAirlineAddress)
        external
        requireAirlineFunded(newAirlineAddress)
    {
        flightSuretyData.registerAirline(newAirlineAddress);
    }

    /**
     * @dev Fund an airline to the registration queue
     *
     */
    function fundAirline(address airline, uint256 amount)
        external
        requireIsOperational
        requireAirlineRegistered(airline)
        returns (bool)
    {
        bool funded = flightSuretyData.fundAirline(airline, amount);
        return funded;
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight() external pure {}

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal pure {}

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );

        // Check this for error fix
        // https://stackoverflow.com/questions/71693977/solidity-error-version-0-8-0-struct-containing-a-nested-mapping-cannot-be-c
        ResponseInfo storage aResponse = oracleResponses[key];

        aResponse.requester = msg.sender;
        aResponse.isOpen = true;
        // oracleResponses[key] = ResponseInfo({
        //                                         requester: msg.sender,
        //                                         isOpen: true
        //                                     });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // ###################################################################################
    // region ORACLE MANAGEMENT
    // ###################################################################################

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}

// Contract that is already deployed
interface IFlightSuretyData {
    function isOperational() external view returns (bool);

    function setOperatingStatus(bool mode) external;

    function isAirlineRegistered(address airline) external view returns (bool);

    function isAirlineFunded(address airline) external view returns (bool);

    function isFlightRegistered(bytes32 flightKey) external view returns (bool);

    function hasFlightLanded(bytes32 flightKey) external view returns (bool);

    function isPassengerInsuredForFlight(bytes32 flightKey, address passenger)
        external
        view
        returns (bool);

    function registerAirline(address newAirline) external;

    function fundAirline(address airline, uint256 amount)
        external
        payable
        returns (bool);

    function getRegisteredAirlineCount() external view returns (uint256);

    function getFundedAirlineCount() external view returns (uint256);

    function registerFlight(
        bytes32 flightKey,
        uint256 timestamp,
        address airline,
        string memory flightNumber,
        string memory departureLocation,
        string memory arrivalLocation
    ) external payable;

    function getCountRegisteredFlights() external view returns (uint256);

    function processFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    ) external;

    function buyInsurance(
        bytes32 flightKey,
        address passenger,
        uint256 amount,
        uint256 payout
    ) external payable;

    function creditInsurees(bytes32 flightKey) external;

    function pay(address payable payoutAddress) external;

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external pure returns (bytes32);

    function fund() external payable;
}
