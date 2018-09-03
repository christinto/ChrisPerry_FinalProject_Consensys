# Avoiding Common Attacks

### Avoid 'reentry' recursive calls and Cross function race conditions
	•	We manage the state of the vehicle to be in a FOR SALE / SOLD state before another person can actually buy the car. 
	•	Mitigate the risk of race condition where the owner of the car can List a car for sale and at the same time transfer the car to another address when someone else has bought the car. 
* transferVehicle has to be in RoadWorthy state and not in ForSale state as another user could be trying to buy a car.

'

    '// Check car is set as for Sale by owner
    modifier forSale(uint _vin {
        require (vehicleMap[vin.status == Status.ForSale); _;
    }

    modifier roadWorthy(uint _vin) {
        require (vehicleMap[_vin].status == Status.RoadWorthy); _;
    }

    modifier carOwnerOnly(address _owner) {
        require (msg.sender == _owner);
        _;
    }
    function transferVehicle(uint _vin, address _newOwner) carOwnerOnly(vehicleMap[_vin].owner) roadWorthy(_vin) stopInEmergency public returns (string) {
     emit TransferVehicle(_vin);
     vehicleMap[_vin].owner = _newOwner;
     vehicleMap[_vin].status = Status.RoadWorthy;
    }`

### Integer Arithmetic Overflow
We ensure that our uint data type variables are not allowed to be over-flowed by using the safeMath library to add and multiply the fees that we collect from the users when they sell / buy cars.
We ensure that we do not transfer to the user more than the price they have set and also that the fee component calculated using safeMath library ensures that the number multiplied and divided is still a valid integer.

`contract VehicleManager is Owned, CircuitBreaker {
 using SafeMath for uint;
 }

 uint fee = (vehicleMap[vin].price).mul(SALE_FEE_PERCENT) / 100;

 emit Fee(fee);

 owner.transfer((vehicleMap[vin].price).sub(fee));
`

### Denial of Service prevention - reduce use of loops and running out of gas limit
	•	The contract avoids any looping behaviour
	•	Avoids recursive calls in the contract
	•	Only the owner of the vehicle can change the state of the vehicle to be for sale
	•	Only vehicles with For Sale state can be bought with ETHER by a buyer

### Reduce malicious creator
	•	The fee component of the car market is a constant value set in the construction of the contract. The owner of the contract can not alter the fee after creation of the contract. 
	•	Only allowing the contract owner to withdraw funds from the contract that is collected from the commission fees during the trading of cars. 
