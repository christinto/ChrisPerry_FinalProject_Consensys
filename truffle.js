module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    //truffle console --network ropsten

//     http://truffleframework.com/docs/advanced/configuration#networks
    //recommended to wrap provider inside a function() to avoid opening too many connections
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*" // Match any network id
        }
    }
};
