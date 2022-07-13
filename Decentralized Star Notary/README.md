# ND1309 C2 Ethereum Smart Contracts, Tokens and Dapps - Project Starter 
**PROJECT: Decentralized Star Notary Service Project** 

## ERC721 Token Name = "Udacity Star Token",

## ERC721 Token Symbol = "UST"

## ERC721 Rinkeby Token Address = "0x2d0C16dF8eB468BC3603b9C20f59b359a9Fef5Dc"

### Dependencies
Package.json is provided in `app/` folder 

`truffle version` output is
```
Truffle v5.5.21 (core: 5.5.21)
Ganache v7.2.0
Solidity - 0.8.14 (solc-js)
Node v16.15.1
Web3.js v1.7.4
```

This project worked succesfully with following versions, you will need to have: 
```
├── copy-webpack-plugin@5.1.2
├── dotenv@16.0.1
├── openzeppelin-solidity@4.6.0
├── truffle-hdwallet-provider@1.0.17
├── web3@1.7.4
├── webpack-cli@3.3.12
├── webpack-dev-server@3.11.3
└── webpack@4.46.0
```

### Run the application
1. Clean the frontend 
```bash
cd app
# Remove the node_modules  
# remove packages
rm -rf node_modules
# clean cache
npm cache clean
rm package-lock.json
# initialize npm (you can accept defaults)
npm init
# install all modules listed as dependencies in package.json
npm install
```

2. Frontend - Once you are ready to start your frontend, run the following from the app folder:
```bash
cd app
npm run dev
```

Once page is loaded and connected to an account, `Status` label will display deploayed Rinkeby Token Address.

You can create a Star by providing `name` and `tokenID` and sumbit with `Create Star` button. `Status` label will inform you about transaction status.

You can retrive the name of a Star by providing its `tokenID` and sumbit with `Look up a Star` button. `Status` label will also inform you about transaction status.