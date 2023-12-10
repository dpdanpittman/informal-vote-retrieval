const axios = require('axios');
const { exec } = require('child_process');
const { writeFile } = require('fs');
const fs = require('fs');
const initialVotesPath = './initialVotes.json';

// Initialize the storage file if it doesn't exist
if (!fs.existsSync(initialVotesPath)) {
    fs.writeFileSync(initialVotesPath, JSON.stringify({}));
}

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}

function extractVoteOption(voteData) {
    if (!voteData || !voteData.option) {
        return 'Not Voted';
    }
    return voteData.option.toUpperCase();
}

function checkAndStoreVote(chainName, proposalId, voteOption) {
    const uniqueId = `${chainName}-${proposalId}`;
    const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));

    console.log(`Stored vote for ${uniqueId}:`, storedVotes[uniqueId]); // Debug log

    if (storedVotes.hasOwnProperty(uniqueId)) {
        if (storedVotes[uniqueId] !== voteOption) {
            console.error(`Vote change detected for ${uniqueId}. Stored: ${storedVotes[uniqueId]}, Current: ${voteOption}`);
        }
    } else if (['YES', 'NO', 'ABSTAIN'].includes(voteOption)) {
        storedVotes[uniqueId] = voteOption;
        fs.writeFileSync(initialVotesPath, JSON.stringify(storedVotes), 'utf8');
    }

    return voteOption;
}

function handleVoteStatusError(uniqueId) {
    const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));
    if (storedVotes.hasOwnProperty(uniqueId)) {
        console.log(`Using stored vote for ${uniqueId}: ${storedVotes[uniqueId]}`);
        return storedVotes[uniqueId];
    } else {
        console.error(`Error and no stored vote for ${uniqueId}`);
        return 'Not Voted';
    }
}

// Cosmos Hub specific functions
async function getProposalsInVotingCosmos() {
    try {
        const response = await axios.get('https://api-cosmoshub-ia.cosmosia.notional.ventures/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusCosmos(proposalId, address) {
    const uniqueId = `CosmosHub-${proposalId}`;
    try {
        const url = `https://api-cosmoshub-ia.cosmosia.notional.ventures/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("CosmosHub", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCosmos(proposalId) {
    try {
        const url = `https://api-cosmoshub-ia.cosmosia.notional.ventures/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Qwoyn Network specific functions
async function getProposalsInVotingQwoyn() {
    try {
        const response = await axios.get('https://api.qwoyn.studio/cosmos/gov/v1beta1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD');
        return response.data.proposals || [];
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusQwoyn(proposalId, address) {
    const uniqueId = `Qwoyn-${proposalId}`;
    try {
        const url = `https://api.qwoyn.studio/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();

            if (['YES', 'NO', 'ABSTAIN'].includes(voteOption)) {
                return checkAndStoreVote("Qwoyn", proposalId, voteOption);
            } else {
                return 'Unspecified'; // Or 'Not Voted'
            }
        } else {
            return 'Unspecified'; // Or 'Not Voted'
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);

        // Check if there's a stored vote before an error occurred
        const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));
        if (storedVotes.hasOwnProperty(uniqueId)) {
            console.log(`Using stored vote for ${uniqueId}: ${storedVotes[uniqueId]}`);
            return storedVotes[uniqueId];
        } else {
            return 'Unspecified'; // Or 'Not Voted'
        }
    }
}

async function getProposalStatusQwoyn(proposalId) {
    try {
        const url = `https://api.qwoyn.studio/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Agoric Specific functions
async function getProposalsInVotingAgoric() {
    try {
        const response = await axios.get('https://main.api.agoric.net/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusAgoric(proposalId, address) {
    const uniqueId = `Agoric-${proposalId}`;
    try {
        const url = `https://main.api.agoric.net/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Agoric", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusAgoric(proposalId) {
    try {
        const url = `https://main.api.agoric.net/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Celestia Specific functions
async function getProposalsInVotingCelestia() {
    try {
        const response = await axios.get('https://rest-celestia.theamsolutions.info/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusCelestia(proposalId, address) {
    const uniqueId = `Celestia-${proposalId}`;
    try {
        const url = `https://rest-celestia.theamsolutions.info/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Celestia", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCelestia(proposalId) {
    try {
        const url = `https://rest-celestia.theamsolutions.info/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Archway Specific functions
async function getProposalsInVotingArch() {
    try {
        const response = await axios.get('https://api.mainnet.archway.io/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusArch(proposalId, address) {
    const uniqueId = `Archway-${proposalId}`;
    try {
        const url = `https://api.mainnet.archway.io/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Archway", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusArch(proposalId) {
    try {
        const url = `https://api.mainnet.archway.io/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Axelar Specific functions
async function getProposalsInVotingAxelar() {
    try {
        const response = await axios.get('https://axelar-lcd.quickapi.com/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusAxelar(proposalId, address) {
    const uniqueId = `Axelar-${proposalId}`;
    try {
        const url = `https://axelar-lcd.quickapi.com/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Axelar", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusAxelar(proposalId) {
    try {
        const url = `https://axelar-lcd.quickapi.com/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Akash Specific functions
async function getProposalsInVotingAkash() {
    try {
        const response = await axios.get('https://api-akash.cosmos-spaces.cloud/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusAkash(proposalId, address) {
    const uniqueId = `Akash-${proposalId}`;
    try {
        const url = `https://api-akash.cosmos-spaces.cloud/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Akash", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusAkash(proposalId) {
    try {
        const url = `https://api-akash.cosmos-spaces.cloud/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Cheqd Specific functions
async function getProposalsInVotingCheq() {
    try {
        const response = await axios.get('https://api.cheqd.nodestake.top/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusCheq(proposalId, address) {
    const uniqueId = `Cheqd-${proposalId}`;
    try {
        const url = `https://api.cheqd.nodestake.top/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Cheqd", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCheq(proposalId) {
    try {
        const url = `https://api.cheqd.nodestake.top/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Coreum Specific functions
async function getProposalsInVotingCoreum() {
    try {
        const response = await axios.get('https://coreum-rest.publicnode.com/cosmos/gov/v1beta1/proposals?proposal_status=2');
        const result = response.data || {};

        if (!result.proposals) {
            console.error('No proposals found in the output');
            return [];
        }
        return result.proposals.map(proposal => {
            return {
                id: proposal.proposal_id,
                ...proposal
            };
        });
    } catch (error) {
        console.error('Failed to get proposals:', error);
        return [];
    }
}

async function getVoteStatusCoreum(proposalId, address) {
    const uniqueId = `Coreum-${proposalId}`;
    try {
        const url = `https://coreum-rest.publicnode.com/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        // Check if the options array exists and has at least one element
        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Coreum", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        // Error handling
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCoreum(proposalId) {
    try {
        const url = `https://coreum-rest.publicnode.com/cosmos/gov/v1beta1/proposals/${proposalId}`;
        const response = await axios.get(url);
        const proposalData = response.data.proposal || {};

        switch (proposalData.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        return 'Unknown Status';
    }
}

// Osmosis specific functions
async function getVoteStatusOsmosis(proposalId, address) {
    const uniqueId = `Osmosis-${proposalId}`;
    try {
        const command = `osmosisd q gov vote ${proposalId} ${address} --output json`;
        const output = await runCommand(command);
        const voteData = JSON.parse(output);

        const voteOption = extractVoteOption(voteData);

        if (['YES', 'NO', 'ABSTAIN'].includes(voteOption)) {
            return checkAndStoreVote("Osmosis", proposalId, voteOption);
        } else {
            return 'Not Voted';  // or any other appropriate placeholder
        }
    } catch (error) {
        // Check if there's a stored vote before the proposal passed
        const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));
        if (storedVotes.hasOwnProperty(uniqueId)) {
            console.log(`Using stored vote for ${uniqueId}: ${storedVotes[uniqueId]}`);
            return storedVotes[uniqueId];
        } else {
            console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
            return 'Not Voted';
        }
    }
}

async function getProposalStatusOsmosis(proposalId) {
    try {
        const output = await runCommand(`osmosisd q gov proposal ${proposalId} --output json`);
        const proposal = JSON.parse(output);

        switch (proposal.status) {
            case 'PROPOSAL_STATUS_VOTING_PERIOD':
                return 'Voting Period';
            case 'PROPOSAL_STATUS_PASSED':
                return 'Passed';
            case 'PROPOSAL_STATUS_REJECTED':
                return 'Rejected';
            default:
                return 'Unknown Status';
        }
    } catch (error) {
        console.error(`Failed to get status for proposal ${proposalId}:`, error);
        throw error;
    }
}

function formatAsAsciiTable(data) {
    let table = '';
    const headers = ['Chain', 'Proposal ID', 'Vote', 'Status'];
    const columnWidths = [20, 15, 30, 20];

    headers.forEach((header, index) => {
        table += header.padEnd(columnWidths[index], ' ') + '|';
    });
    table += '\n';

    columnWidths.forEach(width => {
        table += ''.padEnd(width, '-') + '+';
    });
    table += '\n';

    data.forEach(row => {
        table += `${row.Chain.padEnd(columnWidths[0], ' ')}|${row['Proposal ID'].toString().padEnd(columnWidths[1], ' ')}|${String(row.Vote).padEnd(columnWidths[2], ' ')}|${String(row.Status).padEnd(columnWidths[3], ' ')}|\n`;
    });

    return table;
}

async function main() {
    const votingData = [];

    // Process Qwoyn Network
    const qwoynAddress = 'qwoyn1yatzmzt2954c2gq2k7cy4n7s9d9vz56ku3re5v';
    const proposalsQwoyn = await getProposalsInVotingQwoyn();
    const chainNameQwoyn = 'Qwoyn Network';

    for (const proposal of proposalsQwoyn) {
        const voteStatusQwoyn = await getVoteStatusQwoyn(proposal.proposal_id, qwoynAddress);
        const proposalStatusQwoyn = await getProposalStatusQwoyn(proposal.proposal_id);

        votingData.push({
            Chain: chainNameQwoyn,
            'Proposal ID': proposal.proposal_id,
            Vote: voteStatusQwoyn,
            Status: proposalStatusQwoyn
        });
    }

    // Osmosis processing
    const osmosisAddress = 'osmo1x20lytyf6zkcrv5edpkfkn8sz578qg5saxene9';
    const chainNameOsmosis = 'Osmosis';
    let currentProposalId = 692; // Start from the specified proposal ID for Osmosis

    while (true) {
        try {
            const proposalStatusOsmosis = await getProposalStatusOsmosis(currentProposalId);
            const voteStatusOsmosis = await getVoteStatusOsmosis(currentProposalId, osmosisAddress);

            votingData.push({
                Chain: chainNameOsmosis,
                'Proposal ID': currentProposalId,
                Vote: voteStatusOsmosis,
                Status: proposalStatusOsmosis
            });

            currentProposalId++;
        } catch (error) {
            console.error(`Error processing proposal ${currentProposalId}:`, error);
            break;
        }
    }

    // Cosmos Hub processing
    const cosmosAddress = 'cosmos16k579jk6yt2cwmqx9dz5xvq9fug2tekv6g34pl';
    const proposalsCosmos = await getProposalsInVotingCosmos();
    const chainNameCosmos = 'Cosmos Hub';

    for (const proposal of proposalsCosmos) {
        const voteStatusCosmos = await getVoteStatusCosmos(proposal.id, cosmosAddress);
        const proposalStatusCosmos = await getProposalStatusCosmos(proposal.id);

        votingData.push({
            Chain: chainNameCosmos,
            'Proposal ID': proposal.id,
            Vote: voteStatusCosmos,
            Status: proposalStatusCosmos
        });
    }

    // Agoric processing
    const agoricAddress = 'agoric1x20lytyf6zkcrv5edpkfkn8sz578qg5s8qgulp';
    const proposalsAgoric = await getProposalsInVotingAgoric();
    const chainNameAgoric = 'Agoric';

    for (const proposal of proposalsAgoric) {
        const voteStatusAgoric = await getVoteStatusAgoric(proposal.id, agoricAddress);
        const proposalStatusAgoric = await getProposalStatusAgoric(proposal.id);

        votingData.push({
            Chain: chainNameAgoric,
            'Proposal ID': proposal.id,
            Vote: voteStatusAgoric,
            Status: proposalStatusAgoric
        });
    }

    // Archway processing
    const archAddress = 'archway1x20lytyf6zkcrv5edpkfkn8sz578qg5sqkk89q';
    const proposalsArch = await getProposalsInVotingArch();
    const chainNameArch = 'Archway';

    for (const proposal of proposalsArch) {
        const voteStatusArch = await getVoteStatusArch(proposal.id, archAddress);
        const proposalStatusArch = await getProposalStatusArch(proposal.id)

        votingData.push({
            Chain: chainNameArch,
            'Proposal ID': proposal.id,
            Vote: voteStatusArch,
            Status: proposalStatusArch
        });
    }

    // Celestia processing
    const celestiaAddress = 'celestia1x20lytyf6zkcrv5edpkfkn8sz578qg5syhmn46';
    const proposalsCelestia = await getProposalsInVotingCelestia();
    const chainNameCelestia = 'Celestia';

    for (const proposal of proposalsCelestia) {
        const voteStatusCelestia = await getVoteStatusCelestia(proposal.id, celestiaAddress);
        const proposalStatusCelestia = await getProposalStatusCelestia(proposal.id)

        votingData.push({
            Chain: chainNameCelestia,
            'Proposal ID': proposal.id,
            Vote: voteStatusCelestia,
            Status: proposalStatusCelestia
        });
    }

    // Axelar processing
    const axelarAddress = 'axelar1x20lytyf6zkcrv5edpkfkn8sz578qg5s3nutyk';
    const proposalsAxelar = await getProposalsInVotingAxelar();
    const chainNameAxelar = 'Axelar';

    for (const proposal of proposalsAxelar) {
        const voteStatusAxelar = await getVoteStatusAxelar(proposal.id, axelarAddress);
        const proposalStatusAxelar = await getProposalStatusAxelar(proposal.id)

        votingData.push({
            Chain: chainNameAxelar,
            'Proposal ID': proposal.id,
            Vote: voteStatusAxelar,
            Status: proposalStatusAxelar
        });
    }

    // Akash processing
    const akashAddress = 'akash1x20lytyf6zkcrv5edpkfkn8sz578qg5scx8ykd';
    const proposalsAkash = await getProposalsInVotingAkash();
    const chainNameAkash = 'Akash';

    for (const proposal of proposalsAkash) {
        const voteStatusAkash = await getVoteStatusAkash(proposal.id, akashAddress);
        const proposalStatusAkash = await getProposalStatusAkash(proposal.id)

        votingData.push({
            Chain: chainNameAkash,
            'Proposal ID': proposal.id,
            Vote: voteStatusAkash,
            Status: proposalStatusAkash
        });
    }

    // Cheqd processing
    const cheqAddress = 'cheqd1x20lytyf6zkcrv5edpkfkn8sz578qg5smlxryx';
    const proposalsCheq = await getProposalsInVotingCheq();
    const chainNameCheq = 'Cheqd';

    for (const proposal of proposalsCheq) {
        const voteStatusCheq = await getVoteStatusCheq(proposal.id, cheqAddress);
        const proposalStatusCheq = await getProposalStatusCheq(proposal.id)

        votingData.push({
            Chain: chainNameCheq,
            'Proposal ID': proposal.id,
            Vote: voteStatusCheq,
            Status: proposalStatusCheq
        });
    }

    // Coreum processing
    const coreumAddress = 'cheqd1x20lytyf6zkcrv5edpkfkn8sz578qg5smlxryx';
    const proposalsCoreum = await getProposalsInVotingCoreum();
    const chainNameCoreum = 'Coreum';

    for (const proposal of proposalsCoreum) {
        const voteStatusCoreum = await getVoteStatusCoreum(proposal.id, coreumAddress);
        const proposalStatusCoreum = await getProposalStatusCoreum(proposal.id)

        votingData.push({
            Chain: chainNameCoreum,
            'Proposal ID': proposal.id,
            Vote: voteStatusCoreum,
            Status: proposalStatusCoreum
        });
    }

    const asciiTable = formatAsAsciiTable(votingData);

    writeFile('votingDataCombined.txt', asciiTable, (err) => {
        if (err) {
            console.error('Failed to save file:', err);
            return;
        }
        console.log('Combined voting data saved as ASCII table in votingDataCombined.txt');
    });
}

main();
