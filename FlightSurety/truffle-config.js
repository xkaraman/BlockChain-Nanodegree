var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
// var mnemonic = "around virus ritual skin nose pen cool venture diamond spring lizard aware"

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/");
      },
      network_id: '*',
    }
  },
  compilers: {
    solc: {
      // version: "^0.4.24"
      version: "^0.8.16"
    }
  }
};