import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let fsApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const oracleEventHistory = [];
const oracles = [];//config.oracles;
const MIN_ORACLES = 20
const FEE = "1";
const GAS = 6721975

function logEvent(event) {
  oracleEventHistory.push(event)
  console.log(event);
}

function addOracle(oracle) {
  oracles.push(oracle);
}

async function registerOracles(accounts) {
  logEvent("Started Registering Oracles")
  for (let i = 0; i < accounts.length; i++) {
    const oracle = accounts[i];
    const feeEth = web3.utils.toWei(FEE);

    logEvent(`Attemp to Reg Oracle : ${oracle}`);
    await fsApp.methods.registerOracle().send({ from: oracle, value: feeEth, gas: GAS })
      .then(async receipt => {
        addOracle(oracle);
        let result = await fsApp.methods.getMyIndexes().call({ from: oracle });
        logEvent(`Registerd Succesfully: ${oracle} Indexes: ${result[0]}, ${result[1]}, ${result[2]}`)
      })
      .catch(err => {
        console.log(err)
        logEvent(`Failed to Reg Oracle : ${oracle}`)
      })
  }
  logEvent(`Finished Registering Oracles`)
}

function generateRandomStatus() {
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10; // "STATUS_CODE_ON_TIME";
  const STATUS_CODE_LATE_AIRLINE = 20; //"STATUS_CODE_LATE_AIRLINE";
  const STATUS_CODE_LATE_WEATHER = 30; //"STATUS_CODE_LATE_WEATHER";
  const STATUS_CODE_LATE_TECHNICAL = 40; //"STATUS_CODE_LATE_TECHNICAL";
  const STATUS_CODE_LATE_OTHER = 50;//"STATUS_CODE_LATE_OTHER";

  const statuses = [STATUS_CODE_LATE_AIRLINE];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

async function respondToOracleRequest(oracleIndex, airlineAddress, flightName, flightTimestamp) {
  logEvent(`Responding to Oracle Request [Index: ${oracleIndex}],[Flight Name: ${flightName}]`)

  oracles.forEach(async (oracle) => {
    const flightStatus = generateRandomStatus();
    await fsApp.methods.submitOracleResponse(oracleIndex, airlineAddress, flightName, flightTimestamp, flightStatus)
      .send({ from: oracle, gas: GAS })
      .then(receipt => {
        logEvent(`Oracle Response: ${flightName}, ${flightStatus} `)
      })
      .catch(err => {
        logEvent(`Oracle ${oracle} ${err}`)
      })
  });

  logEvent(`Respond Complete`)
}


async function startOracles() {
  const accounts = await web3.eth.getAccounts()
  const oracles = accounts.slice(-(MIN_ORACLES + 1))
  // console.log(oracles)

  await registerOracles(oracles);

  await fsApp.events.OracleRequest({})
    .on('data', async (event) => {
      console.log("Event list:", event.returnValues.timestamp, "=======")
      // console.log(event.returnValues, "=======")
      const { index, airline, flight, timestamp } = event.returnValues;
      console.log(index, airline, flight, timestamp)
      logEvent(`OracleRequest Event fired: ${event}`)
      await respondToOracleRequest(index, airline, flight, timestamp);
    })
    .on('error', error => {
      logEvent(error)
    })

  await fsApp.events.FlightStatusInfo({ fromBlock: "pending" })
    .on('data', event => {
      logEvent(`FlightStatusInfo Event fired: ${event.blockNumber}`)
    })
    .on('error', error => {
      logEvent(error)
    })
}


const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

app.get('/logs', (req, res) => {
  res.json({ oracleEventHistory });
})

app.get('/oracles', (req, res) => {
  res.json({ oracles });
})

app.set('json spaces', 2)

startOracles();

export default app;


