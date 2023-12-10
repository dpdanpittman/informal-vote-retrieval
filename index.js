const fs = require('fs');
const { getVotingDataCosmos } = require('./chains/cosmoshub');
const { getVotingDataQwoyn } = require('./chains/qwoyn');
const { getVotingDataAgoric } = require('./chains/agoric');
const { getVotingDataArchway }= require('./chains/archway');
const { getVotingDataOsmosis }= require('./chains/osmosis');
const { getVotingDataCelestia }= require('./chains/celestia');
const { formatAsAsciiTable } = require('./utils/utils');

async function main() {
    const votingData = [];

    // Fetch and process voting data for various chains
    await getVotingDataCosmos(votingData);
    await getVotingDataQwoyn(votingData);
    await getVotingDataAgoric(votingData);
    await getVotingDataArchway(votingData);
    await getVotingDataOsmosis(votingData);
    await getVotingDataCelestia(votingData);

    // Combine and format the voting data into an ASCII table
    const asciiTable = formatAsAsciiTable(votingData);

    const reportsPath = './reports/votingDataCombined.txt';

// Save the combined data to a file
    fs.writeFile(reportsPath, asciiTable, (err) => {
        if (err) {
            console.error('Failed to save file:', err);
            return;
        }
        console.log('Combined voting data saved as ASCII table in', reportsPath);
    });
}

main();
