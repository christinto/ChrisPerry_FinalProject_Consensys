
pragma solidity ^0.4.23;
//
// ----------------------------------------------------------------------------
// Owned contract
// ----------------------------------------------------------------------------
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require (msg.sender == owner, "Only owner can call this function");
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(newOwner != address(0));
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

//
// ----------------------------------------------------------------------------
// Circuit breaker contract
// ----------------------------------------------------------------------------

contract CircuitBreaker is Owned {

    bool public stopped = false;

    event Stopped();

    modifier stopInEmergency {require(!stopped);
        _;}

    modifier onlyInEmergency {require(stopped);
        _;}

    function withdraw() onlyInEmergency public {
        owner.transfer(address(this).balance);
    }

    function stop() onlyOwner public returns (bool) {
        stopped = true;
    }

    function start() onlyOwner public returns (bool) {
        stopped = false;
    }
}

// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}

//
// ----------------------------------------------------------------------------
// Vehicle store contract
// ----------------------------------------------------------------------------

contract VehicleManager is Owned, CircuitBreaker {
    using SafeMath for uint;
    uint[] public vins;
    mapping(uint => Vehicle) public vehicleMap;
    uint public numVehicles;
    uint constant SALE_FEE_PERCENT = 1;

    constructor() public {
        numVehicles = 0;
    }

    event NewVehicle(uint _vin, address _owner);
    event TransferVehicle(uint _vin);
    event ForSale(uint _vin);
    event Sold(uint _vin);
    event Fee(uint _fee);

    enum Status {RoadWorthy, ForSale}

    struct Vehicle {
        uint vin;
        uint year;
        string model;
        string make;
        address vehicleOwner;
        address buyer;
        Status status;
        uint price;
    }

    modifier paidEnough(uint _price) { require(msg.value >= _price); _;}

    modifier checkValue(uint _vin) {
        //refund them after pay for item (why it is before, _ checks for logic before func)
        _;
        uint _price = vehicleMap[_vin].price;
        uint amountToRefund = msg.value - _price;
        vehicleMap[_vin].buyer.transfer(amountToRefund);
    }

    // Check car is set as for Sale by owner
    modifier forSale(uint _vin) {
        require (vehicleMap[_vin].status == Status.ForSale); _;
    }

    modifier roadWorthy(uint _vin) {
        require (vehicleMap[_vin].status == Status.RoadWorthy); _;
    }

    modifier carOwnerOnly(address _owner) {
        require (msg.sender == _owner);
        _;
    }

    function registerVehicle(uint _vin, uint _year, string _model, string _make) public {
        emit NewVehicle(_vin, msg.sender);
        vins.push(_vin);
        vehicleMap[_vin] = Vehicle({
        vin: _vin, year: _year, model: _model, make: _make, vehicleOwner: msg.sender, buyer: 0, status: Status.RoadWorthy, price: 0
        });
        numVehicles++;
    }

    function sellVehicle(uint _vin, uint _price) carOwnerOnly(vehicleMap[_vin].vehicleOwner) roadWorthy(_vin) public {
        emit ForSale(_vin);
        vehicleMap[_vin].status = Status.ForSale;
        vehicleMap[_vin].price = _price;
        vehicleMap[_vin].buyer = 0;
    }

    function buyVehicle(uint vin) public stopInEmergency forSale(vin) paidEnough(vehicleMap[vin].price) checkValue(vin) payable {
        emit Sold(vin);
        vehicleMap[vin].status = Status.RoadWorthy;
        vehicleMap[vin].buyer = msg.sender;
        address owner = vehicleMap[vin].vehicleOwner;

        // Transfer ownership across
        vehicleMap[vin].vehicleOwner = msg.sender;

        // send ether to "owner"
        // Take a 1% fee out of the price
        uint fee = (vehicleMap[vin].price).mul(SALE_FEE_PERCENT) / 100;

        emit Fee(fee);

        owner.transfer((vehicleMap[vin].price).sub(fee));
    }

    function transferVehicle(uint _vin, address _newOwner) carOwnerOnly(vehicleMap[_vin].vehicleOwner) roadWorthy(_vin) stopInEmergency public returns (string) {
        emit TransferVehicle(_vin);
        vehicleMap[_vin].vehicleOwner = _newOwner;
        vehicleMap[_vin].status = Status.RoadWorthy;
    }

    /* Fetch vehicle info by VIN */
    function fetchVehicle(uint _vin) public view returns (string model, string make, uint vin, uint year, uint status, uint price, address vehicleOwner, address buyer) {
        model = vehicleMap[_vin].model;
        make = vehicleMap[_vin].make;
        vin = vehicleMap[_vin].vin;
        year = vehicleMap[_vin].year;
        price = vehicleMap[_vin].price;
        status = uint(vehicleMap[_vin].status);
        vehicleOwner = vehicleMap[_vin].vehicleOwner;
        buyer = vehicleMap[_vin].buyer;
        return (model, make, vin, year, status, price, vehicleOwner, buyer);
    }

    function getVehicleOwner(uint _vin) public constant returns (address) {
        address owner = vehicleMap[_vin].vehicleOwner;
        return owner;
    }

    function getVehicleMake(uint _vin) public constant returns (string) {
        string storage vmake = vehicleMap[_vin].make;
        return vmake;
    }

    function getVehicleModel(uint _vin) public constant returns (string) {
        string storage vmodel = vehicleMap[_vin].model;
        return vmodel;
    }

    function getVehicleYear(uint _vin) public constant returns (uint) {
        uint vyear = vehicleMap[_vin].year;
        return vyear;
    }

    function getVins() public view returns (uint[]) {
        return vins;
    }

    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    function() public {
        revert();
    }
}