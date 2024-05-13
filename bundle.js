//import { createRequire } from 'module';
//const require = createRequire(import.meta.url);

//var { ethers } = require('./node_modules/ethers');
//var { Record, Tuple } = require("./node_modules/@bloomberg/record-tuple-polyfill");
import { ethers } from './node_modules/ethers/dist/ethers.esm.js';
import { Record } from "./node_modules/@bloomberg/record-tuple-polyfill/lib/index.esm.js";

async function readData() {
    let providerURL = 'https://mainnet.infura.io/v3/0bb37f2d858f4d15919ed5a06f862776';

    // Setup the webpage.
    const $label1 = document.getElementById('label1');
    const $disputeNum = document.getElementById('disputeNum');
    const $disputeInfo = document.getElementById('disputeInfo');
    const $viewDispute = document.getElementById('viewDispute');
    const $viewLatest = document.getElementById('viewLatest');
    const $addDataInput = document.getElementById('addDataInput');
    const $noticeForInput = document.getElementById('noticeForInput');
    const $listeningToContract = document.getElementById('listeningToContract');
    const $loading = document.getElementById('loading');
    const $percentComplete = document.getElementById('percentComplete');
    $label1.innerHTML = "Finding the latest dispute on the blockchain...";
    $viewLatest.style.visibility = "hidden";
    $viewDispute.style.visibility = "hidden";
    $addDataInput.style.visibility = "hidden";
    $noticeForInput.style.visibility = "hidden";
    $disputeNum.style.visibility = "hidden";
    $loading.style.visibility = "visible";
    $percentComplete.style.visibility = "visible";
    
    var dispute = undefined;

    // Need a provider to connect to smart contract on blockchain.
    const provider = new ethers.providers.JsonRpcProvider(providerURL);
    // Need contract address and ABI.
    const KlerosAddress = '0x988b3A538b618C7A603e1c11Ab82Cd16dbE28069';
    $listeningToContract.innerHTML = `<a style="color: #b7b7b7; font-size: 10px;" target="_blank" href="https://etherscan.io/address/${KlerosAddress}">(Contract: ${KlerosAddress})</a>`
    //const contractABI = ["function jurors() public view returns (Tuple(uint256 stakedTokens, uint256 lockedTokens))"];
    const KlerosABI = [
        "function disputes(uint256) public view returns (Tuple(uint96 subcourtID, uint256 arbitrated, uint256 numberOfChoices, uint8 period, uint256 lastPeriodChange, uint256 drawsInRound, uint256 commitsInRound, bool ruled))",
        "event DisputeCreation(uint256 _disputeID, address _arbitrable)"
    ];
/*    const KlerosABI = [
        {
            "constant": true,
            "inputs": [
              {
                "name": "",
                "type": "uint256"
              }
            ],
            "name": "disputes",
            "outputs": [
              {
                "name": "subcourtID",
                "type": "uint96"
              },
              {
                "name": "arbitrated",
                "type": "address"
              },
              {
                "name": "numberOfChoices",
                "type": "uint256"
              },
              {
                "name": "period",
                "type": "uint8"
              },
              {
                "name": "lastPeriodChange",
                "type": "uint256"
              },
              {
                "name": "drawsInRound",
                "type": "uint256"
              },
              {
                "name": "commitsInRound",
                "type": "uint256"
              },
              {
                "name": "ruled",
                "type": "bool"
              }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
              {
                "indexed": true,
                "name": "_disputeID",
                "type": "uint256"
              },
              {
                "indexed": true,
                "name": "_arbitrable",
                "type": "address"
              }
            ],
            "name": "DisputeCreation",
            "type": "event"
        }
    ];*/

    const Period = [
        'Evidence (Evidence can be submitted. This is also when drawing has to take place.',
        'Commit (Jurors commit a hashed vote. This is skipped for courts without hidden votes.',
        'Vote (Jurors reveal/cast their vote depending on whether the court has hidden votes or not).',
        'Appeal (The dispute can be appealed).',
        'Execution (Tokens are redistributed and the ruling is executed).'
    ];

    // Connect to the Kleros contract.
    const contractKleros = new ethers.Contract(KlerosAddress, KlerosABI, provider);
/*    // Object that is an instance of the web3 library/API.
    const web3 = new Web3(providerURL);  // The URL to your ETH node on the blockchain.
    // Object that points to a contract deployed on the blockchain.
    // This builds a contract object that will allow us to interact with the contract.
    const contractKleros = new web3.eth.Contract(KlerosABI, KlerosAddress);*/
    console.log('Successfully connected to KlerosLiquid.sol\n');

    // Find the highest indexed dispute.
    var retrievedDispute = undefined;
    var disputeIndex = 1000;    // Must be set to a successful index to start with.
    var lastGoodIndex = 0;
    var lastFailedIndex = disputeIndex;
    var latestDisputeIndex = 0;
    var found = false;
    $percentComplete.innerHTML = "0%";
    console.log('Finding highest dispute index in contract...\n');
    while (!found) {
        // Update the percent-searched figure.
        if (disputeIndex <= lastFailedIndex) {
            let percentComplete = ((1 - (lastFailedIndex - lastGoodIndex)/lastFailedIndex)*100);
            if (percentComplete <= 75) {
                $percentComplete.innerHTML = percentComplete.toFixed() + "%";
            } else {
                $percentComplete.innerHTML = percentComplete.toFixed(1) + "%";
            }
        }
        try {
            retrievedDispute = await contractKleros.disputes(disputeIndex);
/*            contractKleros.methods.disputes(disputeIndex).call()
            .then(result => {
                retrievedDispute = result;
            });*/
            lastGoodIndex = disputeIndex;
            // If we've finished the search...
            if (lastFailedIndex - lastGoodIndex == 1) {
                latestDisputeIndex = lastGoodIndex;
                found = true;
            // Else if we're still looking for an index beyond the end of the disputes array.
            } else if (lastFailedIndex <= disputeIndex) {
                disputeIndex *= 2;
            // Else we're now executing a binary search protocol within an upper and lower limit.
            } else {
                disputeIndex += Math.round((lastFailedIndex - lastGoodIndex) / 2);
            }
        // If our search index is beyond the end of the disputes array.
        } catch(error) {
            //console.log(`Unsuccessfully tried index ${disputeIndex}.`);
            lastFailedIndex = disputeIndex;
            disputeIndex -= Math.round((lastFailedIndex - lastGoodIndex) / 2);
        }
    }
    $viewLatest.innerHTML = `View latest dispute (${latestDisputeIndex + 1})`;
    $viewLatest.style.visibility = "hidden";
    $disputeNum.style.visibility = "visible";
    $loading.style.visibility = "hidden";
    $percentComplete.style.visibility = "hidden";
    //console.log(retrievedDispute);
    updateAndPrintRecord();
    $label1.innerHTML = "The latest dispute created on Kleros is:";
    $viewDispute.style.visibility = "visible";
    $addDataInput.style.visibility = "visible";
    $noticeForInput.style.visibility = "visible";

    function updateAndPrintRecord() {
        // Get arbitrating contract name.
        var xmlHttp = new XMLHttpRequest();
        let theUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${retrievedDispute[1].toHexString()}&apikey=MI8AHYI1T98MZB61F55CSZCAWGFC8DR6DQ`;
        xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
        xmlHttp.send( null );
        let response = JSON.parse(xmlHttp.responseText);
        // Create Record.
        dispute = Record({
            subcourt: retrievedDispute[0].toNumber(),
            arbitrator: retrievedDispute[1].toHexString(),
            arbitratorName: response.result["0"].ContractName,
            arbitratorCompVersion: response.result["0"].CompilerVersion,
            numberOfChoices: retrievedDispute[2].toNumber(),
            period: retrievedDispute[3],
            lastPeriodChange: retrievedDispute[4].toNumber(),
            drawsInRound: retrievedDispute[5].toNumber(),
            commitsInRound: retrievedDispute[6].toNumber(),
            ruled: retrievedDispute[7]
        });
        // Print to console.
        console.log(`Dispute at index ${disputeIndex}:`);
        console.log("subcourt: ", dispute.subcourt);
        console.log("arbitrator: ", dispute.arbitrator);
        console.log("(", dispute.arbitratorName, ", ", dispute.arbitratorCompVersion, ")");
        console.log("numberOfChoices: ", dispute.numberOfChoices);
        console.log("period: ", dispute.period);
        console.log("lastPeriodChange: ", dispute.lastPeriodChange);
        console.log("drawsInRound: ", dispute.drawsInRound);
        console.log("commitsInRound: ", dispute.commitsInRound);
        console.log("ruled: ", dispute.ruled);
        // Update the front-end.
        let fontColor = "#d9d9d9";
        $disputeNum.innerHTML = disputeIndex + 1;   // +1 because the dispute index starts at 0.
        let disputeRuledString = '';
        if (dispute.ruled) {
            disputeRuledString = `<br>This dispute has been ruled upon.`
        } else {
            disputeRuledString = `<br>This dispute has not yet been ruled upon.`
        }
        $disputeInfo.innerHTML = 
            `<font color="${fontColor}">Dispute ID:</font> ${disputeIndex}
            <br><font color="${fontColor}">Arbitration contract:</font>
            <br><a color="white" target="_blank" href="https://etherscan.io/address/${dispute.arbitrator}">${dispute.arbitrator}</a> (click to view etherscan)
            <br>${dispute.arbitratorName} (${dispute.arbitratorCompVersion})
            <br><font color="${fontColor}">Juror choices:</font> Jurors given ${dispute.numberOfChoices} choices
            <br><font color="${fontColor}">Current adjudication period:</font>
            <br>${Period[dispute.period]}
            ${disputeRuledString}
            <br><font color="${fontColor}">Time of last period change:</font>
            <br>${new Date(dispute.lastPeriodChange * 1000)}
            <br><font color="${fontColor}">Subcourt:</font> ${dispute.subcourt}
            <br><font color="${fontColor}">Number of draws in round:</font> ${dispute.drawsInRound}
            <br><font color="${fontColor}">Number of commits in round:</font> ${dispute.commitsInRound}`;
    }

    // Listen for dispute creation events.
    contractKleros.on('DisputeCreation', (_disputeID, _arbitrable, event) => {
        console.log('Transfer event triggered:', {
            DisputeID: _disputeID,
            ArbitrableAddress: _arbitrable,
            data: event
        });
        latestDisputeIndex = _disputeID;
        $viewLatest.innerHTML = `View latest dispute (${latestDisputeIndex + 1})`;
        $viewLatest.style.visibility = "visible";
    });
    
    // Monitor the front-end.
    $viewDispute.addEventListener('click', async (e) => {
        e.preventDefault();
        disputeIndex = $addDataInput.value - 1;
        console.log(`Seeking dispute index: ${disputeIndex}`);
        if (disputeIndex < 0) {
            disputeIndex = 0;
            $addDataInput.value = disputeIndex + 1;
        } else if (disputeIndex > latestDisputeIndex) {
            disputeIndex = latestDisputeIndex;
            $addDataInput.value = disputeIndex + 1;
        }
        $label1.innerHTML = `Retrieving info for dispute number ${disputeIndex + 1}`;
        $disputeNum.style.visibility = "hidden";
        $loading.style.visibility = "visible";
        $disputeNum.style.visibility = "hidden";
        retrievedDispute = await contractKleros.disputes(disputeIndex);
/*        retrievedDispute = await contractKleros.methods.disputes(disputeIndex).call()
        .then(result => {
                retrievedDispute = result;
            });*/
        updateAndPrintRecord();
        $disputeNum.style.visibility = "visible";
        $loading.style.visibility = "hidden";
        $disputeNum.style.visibility = "visible";
        if (disputeIndex == latestDisputeIndex) {
            $label1.innerHTML = "The latest dispute created on Kleros is:";
            $viewLatest.style.visibility = "hidden";
        } else {
            $label1.innerHTML = "Showing info for dispute number:";
            $viewLatest.style.visibility = "visible";
        }
        $addDataInput.value = '';
    })

    $viewLatest.addEventListener('click', async (e) => {
        e.preventDefault();
        disputeIndex = latestDisputeIndex;
        console.log(`Seeking dispute index: ${disputeIndex}`);
        $label1.innerHTML = `Retrieving info for dispute number ${disputeIndex + 1}`;
        $disputeNum.style.visibility = "hidden";
        $loading.style.visibility = "visible";
        retrievedDispute = await contractKleros.disputes(disputeIndex);
/*        retrievedDispute = await contractKleros.methods.disputes(disputeIndex).call()
        .then(result => {
                retrievedDispute = result;
            });*/
        updateAndPrintRecord();
        $label1.innerHTML = "The latest dispute created on Kleros is:";
        $viewLatest.style.visibility = "hidden";
        $disputeNum.style.visibility = "visible";
        $loading.style.visibility = "hidden";
    })
}

document.addEventListener('DOMContentLoaded', () => {
    readData();
});

/*// Read other blockchain events.
    const WETH_Address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH contract address

    // ABI portion for the Transfer event
    const WETH_ABI = [
    {
        anonymous: false,
        inputs: [
        {
            indexed: true,
            internalType: 'address',
            name: 'from',
            type: 'address'
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'to',
            type: 'address'
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256'
        }
        ],
        name: 'Transfer',
        type: 'event'
    }
    ];

    // Connect to the WETH contract.
    const contractWETH = new ethers.Contract(WETH_Address, WETH_ABI, provider);
    console.log('Successfully connected to WETH contract\n');

    contractWETH.on('Transfer', (from, to, value, event) => {
        console.log('Transfer event triggered:', {
        from: from,
        to: to,
        value: value.toString(),
        data: event,
        });
    });*/