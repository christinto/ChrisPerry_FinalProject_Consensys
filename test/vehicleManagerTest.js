var VehicleManager = artifacts.require("./VehicleManager.sol");

/*
●  	Create at least 5 tests for each smart contract
○  	Write a sentence or two explaining what the tests are covering, and explain why you wrote those tests
*/

contract('VehicleManager', function (accounts) {
    const owner = accounts[0];
    const alice = accounts[1];
    const bobby = accounts[2];
    const carDeposit = web3.toBigNumber(2);

    var vin;
    const inputVin = 1005;
    const year = 2018;
    const make = "Lamboghini";
    const model = "Aventador";

    const emptyAddress = '0x0000000000000000000000000000000000000000';

    it("register a new car with provided VIN and details", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var eventEmitted = false;

        var event = vehicleManager.NewVehicle();

        await event.watch((err, res) => {
            vin = res.args._vin;
            eventEmitted = true
        });

        await vehicleManager.registerVehicle(inputVin, year, model, make, {from: alice});

        const result = await vehicleManager.fetchVehicle.call(vin);
        const numOfVehicles = await vehicleManager.numVehicles.call();

        assert.equal(result[0], model, 'the model of the last added vehicle does not match the expected value');
        assert.equal(result[1], make, 'the make of the last added vehicle does not match the expected value');
        assert.equal(result[3], year, 'the year of the last added vehicle does not match the expected value');
        assert.equal(result[4].toString(10), 0, 'the status of the vehicle should be "RoadWorthy" which is declared first in the status enum');
        assert.equal(result[6], alice, 'the address adding the vehicle should be listed as the vehicleOwner');
        assert.equal(result[7], emptyAddress, 'the buyer address should be set to 0 when a vehicle is added');

        assert.equal(eventEmitted, true, 'adding a car should emit a New Vehicle event');
        assert.equal(parseInt(numOfVehicles), 1, 'adding a car should add new car');
    });

    it("should allow vehicle owner to list vehicle up for sale with price", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var eventEmitted = false;

        var event = vehicleManager.ForSale();

        await event.watch((err, res) => {
            vin = res.args._vin;
            eventEmitted = true
        });

        const salePrice = web3.toWei(2, "ether");

        await vehicleManager.sellVehicle(vin, salePrice, {from: alice});

        const result = await vehicleManager.fetchVehicle.call(vin);
        assert.equal(result[4].toString(10), 1, 'the status of the vehicle should be "For Sale" which is declared second in the status enum');
        assert.equal(result[5], salePrice, 'the price of the vehicle should be listed as salePrice');

        assert.equal(result[6], alice, 'the address adding the vehicle should be listed as the vehicleOwner');
        assert.equal(result[7], emptyAddress, 'the buyer address should be set to 0 when a vehicle is added');
        assert.equal(eventEmitted, true, 'should emit a For Sale Vehicle event');
    });

    var actualFee;
    it("should allow someone to purchase the vehicle", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var eventEmitted = false;

        var event = vehicleManager.Sold();
        var fee = vehicleManager.Fee();

        await event.watch((err, res) => {
            vin = res.args._vin;
            eventEmitted = true
        });

        await fee.watch((err, res) => {
            actualFee = res.args._fee;
        });

        const salePrice = web3.toWei(2, "ether");

        var aliceBalanceBefore = await web3.eth.getBalance(alice).toNumber();
        var bobbyBalanceBefore = await web3.eth.getBalance(bobby).toNumber();

        await vehicleManager.buyVehicle(vin, {from: bobby, value: salePrice});

        var aliceBalanceAfter = await web3.eth.getBalance(alice).toNumber();
        var bobbyBalanceAfter = await web3.eth.getBalance(bobby).toNumber();

        const result = await vehicleManager.fetchVehicle.call(vin);

        assert.equal(result[4].toString(10), 0, 'the status of the vehicle should be "Roadworthy" which is declared first in the status enum');
        assert.equal(result[6], bobby, 'the buyers address should be listed as the vehicleOwner');
        assert.equal(result[7], bobby, 'the buyers address should be listed as the buyer');
        assert.equal(eventEmitted, true, 'should emit a Sold Vehicle event');
        assert.equal(aliceBalanceAfter, aliceBalanceBefore + parseInt(salePrice, 10) - parseInt(actualFee, 10), "alice's balance should be increased by the salePrice of the vehicle");
        assert.isBelow(bobbyBalanceAfter, bobbyBalanceBefore - salePrice, "bobby's balance should be reduced by more than the price of the vehicle (including gas costs)");
        assert.equal(salePrice * (1 / 100), parseInt(actualFee, 10), "actual fee should be 1 percent of sale price");
    });

    it("should allow vehicle owner to transfer car to another owner", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var eventEmitted = false;

        var event = vehicleManager.TransferVehicle();

        await event.watch((err, res) => {
            vin = res.args._vin;
            eventEmitted = true
        });

        await vehicleManager.transferVehicle(vin, alice, {from: bobby});

        const result = await vehicleManager.fetchVehicle.call(vin);

        assert.equal(result[0], model, 'the model of the last added vehicle does not match the expected value');
        assert.equal(result[1], make, 'the make of the last added vehicle does not match the expected value');
        assert.equal(result[3], year, 'the year of the last added vehicle does not match the expected value');
        assert.equal(result[4].toString(10), 0, 'the status of the vehicle should be "RoadWorthy" which is declared first in the status enum');
        assert.equal(result[6], alice, 'the address transfered to should be vehicleOwner');

        assert.equal(eventEmitted, true, 'adding a car should emit a Transfer Vehicle event');
    });

    it("should stop any transfer once circuit breaker is invoked", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var eventEmitted = false;

        var event = vehicleManager.Stopped();

        await event.watch(() => {
            eventEmitted = true
        });

        await vehicleManager.stop({from: owner});

        const stopped = await vehicleManager.stopped.call();

        assert.equal(stopped, true, 'contract should be stopped for sensitive actions');

        try {
            await vehicleManager.transferVehicle(vin, bobby, {from: alice});
        } catch (err) {
        }
    });

    it("should withdraw any balance from contract to owner", async () => {
        const vehicleManager = await VehicleManager.deployed();

        var ownerBalanceBefore = await web3.eth.getBalance(owner).toNumber();

        await vehicleManager.withdraw({from: owner});

        var ownerBalanceAfter = await web3.eth.getBalance(owner).toNumber();

        const stopped = await vehicleManager.stopped.call();

        assert.equal(stopped, true, 'contract should be stopped for sensitive actions');
        assert.isBelow(ownerBalanceBefore, ownerBalanceAfter, 'owner balance should be higher after withdrawal');
    });
});