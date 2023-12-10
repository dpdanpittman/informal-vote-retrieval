const fs = require('fs');
const { getVotingDataCosmos } = require('./chains/cosmoshub');
const { getVotingDataAgoric } = require('./chains/agoric');
const { getVotingDataArchway }= require('./chains/archway');
const { getVotingDataOsmosis }= require('./chains/osmosis');
const { getVotingDataCelestia }= require('./chains/celestia');
const { getVotingDataDYDX }= require('./chains/dydx');
const { getVotingDataCoreum }= require('./chains/coreum');
const { getVotingDataCheq }= require('./chains/cheqd');
const { getVotingDataAkash }= require('./chains/akash');
const { getVotingDataAxelar }= require('./chains/axelar');
const { getVotingDataEvmos}= require('./chains/evmos');
const { getVotingDataInjective}= require('./chains/injective');
const { getVotingDataJuno}= require('./chains/juno');
const { getVotingDataMedibloc}= require('./chains/medibloc');
const { getVotingDataQuicksilver}= require('./chains/quicksilver');
const { getVotingDataRegen}= require('./chains/regen');
const { getVotingDataStride}= require('./chains/stride');
const { formatAsAsciiTable } = require('./utils/utils');

async function main() {
    const votingData = [];

    // Fetch and process voting data for various chains
    await getVotingDataCosmos(votingData);
    await getVotingDataAgoric(votingData);
    await getVotingDataArchway(votingData);
    await getVotingDataOsmosis(votingData);
    await getVotingDataCelestia(votingData);
    await getVotingDataDYDX(votingData);
    await getVotingDataCoreum(votingData);
    await getVotingDataAkash(votingData);
    await getVotingDataCheq(votingData);
    await getVotingDataAxelar(votingData);
    await getVotingDataEvmos(votingData);
    await getVotingDataInjective(votingData);
    await getVotingDataJuno(votingData);
    await getVotingDataMedibloc(votingData);
    await getVotingDataQuicksilver(votingData);
    await getVotingDataRegen(votingData);
    await getVotingDataStride(votingData);

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
