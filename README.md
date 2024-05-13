# KlerosDisputeMonitor
A live monitor for new and past disputes on the Kleros platform.

Developed by Tim Mapperson, May 2024.

The Kleros Dispute Monitor is a rudimentary demonstration of accessing and listening to the KlerosLiquid contract (address 0x988b3A538b618C7A603e1c11Ab82Cd16dbE28069), searching it for the most recently registered dispute, and allowing the user to view the core details of all disputes created to date.

The app searches the KlerosLiquid contract upon loading the page for the most recent dispute, and thereafter monitors the 'DisputeCreation(_disputeID, _arbitrable)' function for creation events of new disputes. The UI updates, offering the user to display the information pertaining to the latest dispute.

ethers.esm.js is from the Ethers npm module (ethers/dist/ethers.esm.js).
index.esm.js is from the @bloomberg npm module for Records and Tuples (@bloomberg/record-tuple-polyfill/lib/index.esm.js).
