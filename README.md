# Car World market
Tools & Framework needed.
Metamask-wallet
Truffle framework
Node latest version

# What does this project do

A car market for people to list their vehicles and set them for sale.
Driving the next era of ether based crypto-commerce. ;)

Owners of a vehicle can set the price in ETHER when they list a vehicle up for sale.

*Please note that the sale price of your car is first set when you transfer the vehicle to another address, not at initial registration. :)

Metamask integration will allow you to see which vehicles are owned by you / can be purchased if owned by another address.

Metamask should be connected to the local ganache-cli environment on port 8545. 

Select the address you want to use from metamask when interacting with the car mart. 

1. List your car for sale and set the price asking for
2. Car owner can also transfer the ownership of their listed vehicle to another address.
3. Someone can buy the listed cars that is not their's by sending in ETH that covers the price asked.
4. Purchase car by sending the price in Ether and any extra will be refunded back to buyer. 

5. Car Mart contract owner will take a small fee out of the purchase price when a car gets sold. (1% currently).
6. Circuit breaker will stop people from selling and buying cars / allow owner to withdraw the balance from contract.

# How to Setup

1. Install Truffle and Ganache globally.

```
$ npm install -g truffle
$ npm install -g ganache-cli
```

2. Clone this repository, cd into the directory, and install the node module dependencies.
```
$ git clone https://github.com/christinto/ChrisPerry_FinalProject_Consensys.git
$ cd ChrisPerry_FinalProject_Consensys
$ npm install
```

3. Open a separate terminal and run the Ganache test blockchain.
```
$ ganache-cli
```

4. Compile and migrate the smart contracts.
```
$ truffle compile
$ truffle migrate
```

5. Run the tests to make sure the contract is working correctly.
```
$ truffle test
```
6. Connect metamask to ganache-cli

	•	Metamask should be connected to the local ganache-cli environment on port 8545. 
	•	Select Private Network - localhost:8545 
	•	Metamask will inject the account into the app 

7. Start lite-server to serve a local instance of the app. 
Lite server is setup in bs-config.json to serve the files required.
```
$ npm run dev
```

8. Browse to URL in browser:
```
The server will launch the app at http://localhost:3000
```
Enjoy the app! :)
