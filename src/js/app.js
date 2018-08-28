//from github/trufflesuite/truffle-contract library

App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
            web3 = new Web3(App.web3Provider);
        }
        console.log('init');
        return App.initContract();
    },

    initContract: function () {
        $.getJSON('VehicleManager.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract.
            var VehicleManagerArtifact = data;
            App.contracts.VehicleManager = TruffleContract(VehicleManagerArtifact);

            // Set the provider for our contract.
            App.contracts.VehicleManager.setProvider(App.web3Provider);

            return App.getVehicles();
        });

        //jquery triggers
        return App.bindEvents();
    },

    getVehicles: async function () {
        var vehicleRows = $('#vehicles');
        var template = $('#template');

        var vehicleManagerInstance;

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;
                return vehicleManagerInstance.getVins.call()
            }).then(function (vins) {
                for (var i=0; i < vins.length; i++) {
                    vehicleManagerInstance.fetchVehicle.call(vins[i]).then(function (details) {
                        var sellPrice = web3.fromWei(details[5], 'ether');
                        template.find('#descTitle').text(details[0] + ' ' + details[1]);
                        template.find('.vin').text(details[2].toNumber());
                        template.find('.year').text(details[3].toNumber());
                        template.find('.price').text(sellPrice);
                        template.find('.sellPrice').text(sellPrice);

                        // Set id of the sellPrice input field to link to VIN
                        template.find('.sellPrice').attr('id', ('sellPrice' + details[2].toString()));

                        template.find('.btn-sellVehicle').attr('data-id', details[2].toNumber());
                        template.find('.btn-buyVehicle').attr('data-id', details[2].toNumber());
                        template.find('.btn-buyVehicle').attr('data-price', sellPrice);

                        // Disable Buy button if status is not for sale
                        var status;
                        switch(details[4].toNumber()) {
                            case 0:
                                status = 'Road Worthy';
                                template.find('.btn-buyVehicle').attr('disabled', true);
                                break;
                            case 1:
                                status = 'For Sale';
                                template.find('.btn-buyVehicle').attr('disabled', false);
                                break;
                        }

                        template.find('.status').text(status);

                        // Disable Buy button for owner == account
                        if (details[6] == account) {
                            template.find('.btn-buyVehicle').attr('disabled', true);
                            template.find('.btn-sellVehicle').attr('disabled', false);
                            template.find('.owner-badge').show();
                        } else {
                            template.find('.btn-sellVehicle').attr('disabled', true);
                            template.find('.owner-badge').hide();
                        }

                        vehicleRows.append(template.html());

                    });
                }
            })
        });

    },

    bindEvents: function () {
        $(document).on('click', '#submitButton', App.submitDetail);
        $(document).on('click', '#searchButton', App.search);
        $(document).on('click', '#transferButton', App.transfer);
        $(document).on('click', '.btn-sellVehicle', App.sellVehicle);
        $(document).on('click', '.btn-buyVehicle', App.buyVehicle);
    },

    sellVehicle: function(event) {
        event.preventDefault();

        var vin = parseInt($(event.target).data('id'));
        var inputId = '#sellPrice' + vin;
        var sellPrice = parseInt($(inputId).val());
        console.log("sell price", vin, sellPrice);

        if (!sellPrice) {
            $(inputId).attr('style', "border-radius: 5px; border:#FF0000 1px solid;");
            $(inputId).focus();
            return;
        }

        var price = web3.toWei(sellPrice, "ether");

        var vehicleManagerInstance;

        web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;

                var contractEvent = vehicleManagerInstance.ForSale();

                contractEvent.watch(function (err, res) {
                    var vin = res.args._vin;
                    console.log("succesfully listed for sale", vin);
                    location.reload();
                });

                vehicleManagerInstance.sellVehicle(vin, price, {from: account});
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },
    buyVehicle: function(event) {
        event.preventDefault();

        var vin = parseInt($(event.target).data('id'));
        var price = parseInt($(event.target).data('price'));
        console.log("buy price", vin, price);

        if (!price) {
            return;
        }

        var price = web3.toWei(price, "ether");

        var vehicleManagerInstance;

        web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;

                var contractEvent = vehicleManagerInstance.Sold();

                contractEvent.watch(function (err, res) {
                    var vin = res.args._vin;
                    console.log("succesfully sold", vin);
                    setTimeout(location.reload(), 2000);
                });

                vehicleManagerInstance.buyVehicle(vin, {from: account, value: price});
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },
    submitDetail: function (event) {
        event.preventDefault();

        var vin = parseInt($('#vin').val());
        var year = $('#year').val();
        var model = $('#model').val();
        var make = $('#make').val();

        var vehicleManagerInstance;

        web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;

                var contractEvent = vehicleManagerInstance.NewVehicle();

                contractEvent.watch(function (err, res) {
                    var vin = res.args._vin;
                    console.log("succesfully listed", vin);
                });

                return vehicleManagerInstance.registerVehicle(vin, year, model, make, {from: account});
            }).then(function (result) {
                setTimeout(location.reload(), 2000);
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },

    search: function (event) {
        event.preventDefault();

        var vsvin = parseInt($('#vsvin').val());

        var vehicleManagerInstance;

        web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;

                return vehicleManagerInstance.fetchVehicle.call(vsvin);
            }).then(function (result) {
                var askPrice = web3.fromWei(result[5], 'ether');
                $('#owneraddress').text(result[6]);
                $('#vmake').text(result[1]);
                $('#vmodel').text(result[0]);
                $('#vvin').text(result[2]);
                $('#vyear').text(result[3]);

                // Vehicle is for sale
                switch (result[4].toNumber()) {
                    case 0:
                        $('#vstatus').text('Road worthy');
                        $('#vprice').text('No price set');
                        break;
                    case 1:
                        $('#vstatus').text('For Sale');
                        $('#vprice').text(askPrice);
                        break;
                }

                console.log(result)
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },
    transfer: function (event) {
        event.preventDefault();

        var vtid = parseInt($('#vtid').val());
        var newOwnerAddress = $('#newOwnerAddress').val();

        console.log(vtid);

        var vehicleManagerInstance;

        web3.eth.getAccounts(function (error, accounts) {

            if (error) {
                console.log(error);
            }

            var account = accounts[0];
            App.contracts.VehicleManager.deployed().then(function (instance) {
                vehicleManagerInstance = instance;
                var contractEvent = vehicleManagerInstance.TransferVehicle();

                contractEvent.watch(function (err, res) {
                    var vin = res.args._vin;
                    console.log("succesfully transferred", vin);
                    setTimeout(location.reload(), 2000);
                });

                vehicleManagerInstance.transferVehicle(vtid, newOwnerAddress, {from: account});
            })
                .catch(function (err) {
                    console.log(err.message);
                });
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
