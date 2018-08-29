# Design Pattern Decisions

### Circuit breaker

I have implemented a circuit breaker to allow the owner of the contract to stop the trading and buying of cars in case of an emergency.

Also, withdrawal of ETHER from the contract is only allowed when the owner stops the contract and can only withdraw the ETHER to the owner's address.

The modifiers onlyInEmergency and stopInEmergency allows the VehicleManager contract to ensure that functions like buyVehicle are stopped if theres an emergency and no ether is being sent to the contract.


` function buyVehicle(uint vin) public stopInEmergency forSale(vin) paidEnough(vehicleMap[vin].price) checkValue(vin) payable {...}
`

Whole contract

`contract CircuitBreaker is Owned {

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
 }`

###  Fail early and fail loud

  Important features such as transferVehicle, buy and sell have modifiers that check for conditions are met and if not, will throw an error if the required conditions are not met.

  Only the car Owner can list the car for sale and it will check first before updating the status on the bike.
    `  modifier forSale(uint _vin) {
             require (vehicleMap[_vin].status == Status.ForSale); _;
         }

         modifier roadWorthy(uint _vin) {
             require (vehicleMap[_vin].status == Status.RoadWorthy); _;
         }

         modifier carOwnerOnly(address _owner) {
             require (msg.sender == _owner);
             _;
         }

             function sellVehicle(uint _vin, uint _price) carOwnerOnly(vehicleMap[_vin].owner) roadWorthy(_vin) public {
                 emit ForSale(_vin);
                 vehicleMap[_vin].status = Status.ForSale;
                 vehicleMap[_vin].price = _price;
                 vehicleMap[_vin].buyer = 0;
             }
     `

### Restricting access to certain functions

Another pattern implemented is, only the owner of the contract is able to withdraw and transfer the ownership of the contract.

Only the owner of the contract can withdraw the ETHER that is held on the contract and when we transfer the ownership of the contract, we have to specify the allowed address to claim ownership and then the new owner will be able to call **acceptOwnership()** with their account that matches the address of the newOwner.

`contract Owned {
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
 }`