# Ethereum SupplyChain Dapp

# Project write up:
Create a DApp that  can verify the supply chain of coffee from harvesting, packing to distribution, retailers and consumers.


Testing with latest stable releases of Nodejs, Truffle, ganache, web3js

## Dependencies:
```
Truffle v5.5.29 (core: 5.5.29)
Ganache v7.4.0
Solidity - 0.8.16 (solc-js)
Node v16.17.0
Web3.js v1.7.4

Other libraries used include:
[x] dotenv
[x] @truffle/contract
[x] @truffle/hdwallet-provider
```

## Diagrams

Activity, Class, Sequence and State Diagrams can be found in Diagramas folder

## Testing
1. `ganache -m "mnemonic phrase"` to run a local blockchain
2. `truffle test` to run tests that test the contracts

## Deploy to local-blockchain
1. `ganache -m "mnemonic phrase"` to run a local blockchain
2. Make sure to have network configuration in `truffle-config.js` such as 
    ```
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "1337",       // Any network (default: none)
    },
    ```
3. `truffle migrate --reset`

## Deploy to Rinkeby
1. Config `truffle-config.js` to include .env with mnemonics phrase and infura keys
2. Set `rinkeby` network config 
```
rinkeby: {
      provider: () =>
      new HDWalletProvider({
        mnemonic: {
          phrase: MNEMONIC
        },
        providerOrUrl: "https://rinkeby.infura.io/v3/" + ENDPOINT_KEY,
        numberOfAddresses: 1,
        shareNonce: true,
      }),
      network_id: '4',
      confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
```
3. Run `truffle migrate --network rinkeby`

### Results 
 ```
 Deploying 'SupplyChain'
   -----------------------
   > transaction hash:    0x270fa5185062714ed73f6600423f34e64f24aed9908a5de39ffc139fe5784b3d
   > Blocks: 0            Seconds: 8
   > contract address:    0xbc22e83E6AE03beA85F742111aD69bB4FDc2E1b6
   > block number:        11378369
   > block timestamp:     1663150771
   > account:             0xCF5492fe2706771301D7bc623Db8Bc8f13Df8085
   > balance:             0.156267142461933009
   > gas used:            2816741 (0x2afae5)
   > gas price:           2.500000008 gwei
   > value sent:          0 ETH
   > total cost:          0.007041852522533928 ETH
```

A screenshot showing the result of the UI and interaction with the smart contract can be found in images folder
## Front End
Run front-end with 

`npm run dev`

Through the front end, one can execute various contract methods. Currently, all methods are called from `App.metamaskAccountID` which is the owner and has all the assigned roles. This of course can be changed and utilize the various roles we implemented.