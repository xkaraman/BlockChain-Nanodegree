//SPDX-License-Identifier: BSD
pragma solidity >=0.8 <=0.8.17;

/// Provides basic authorization control
contract Ownable {
    // Check this for payable in v0.8
    // https://ethereum.stackexchange.com/questions/94707/how-to-fix-typeerror-type-address-is-not-implicitly-convertible-to-expected-ty
    address private origOwner;

    // Define an Event
    event TransferOwnership(address indexed oldOwner, address indexed newOwner);

    /// Assign the contract to an owner
    constructor () {
        origOwner = msg.sender;
        emit TransferOwnership(address(0), origOwner);
    }

    // Helper function to be payable
    function transfer() public payable {
       payable(origOwner).transfer(msg.value);
    }
    
    /// Look up the address of the owner
    function owner() public view returns (address) {
        return origOwner;
    }

    /// Define a function modifier 'onlyOwner'
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /// Check if the calling address is the owner of the contract
    function isOwner() public view returns (bool) {
        return msg.sender == origOwner;
    }

    /// Define a function to renounce ownerhip
    function renounceOwnership() public onlyOwner {
        emit TransferOwnership(origOwner, address(0));
        origOwner = address(0);
    }

    /// Define a public function to transfer ownership
    /// Why we need seperate functions for this? What are our
    /// gains over a public one with the same modifiers?
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /// Define an internal function to transfer ownership
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit TransferOwnership(origOwner, newOwner);
        origOwner = newOwner;
    }
}
