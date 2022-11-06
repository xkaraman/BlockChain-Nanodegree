// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// AIRLINE DATA
struct Airline {
    // address wallet;
    string name;
    bool isRegistered;
    bool isFunded;
    uint256 funds;
    uint256 votes;
}

// Flight Data
struct Flight {
    bool isRegistered;
    bool isClosed;
    address airline;
    string flightNumber;
    string origin;
    string destination;
    uint256 departureTime;
    uint8 statusCode;
    bytes32 flightKey;
}

// passengers info
struct InsuranceClaim {
    address passengerWallet;
    bytes32 flightKey;
    uint256 purchaseAmount;
    uint256 payoutPercentage;
}
