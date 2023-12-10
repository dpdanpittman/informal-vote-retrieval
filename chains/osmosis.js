const { runCommand, checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');

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

async function getVoteStatusOsmosis(proposalId, address) {
    const uniqueId = `Osmosis-${proposalId}`;
    try {
        const command = `osmosisd q gov vote ${proposalId} ${address} --output json`;
        const output = await runCommand(command);
        const voteData = JSON.parse(output);

        const voteOption = voteData.option ? voteData.option.replace('VOTE_OPTION_', '').toUpperCase() : 'Not Voted';

        if (['YES', 'NO', 'ABSTAIN'].includes(voteOption)) {
            return checkAndStoreVote("Osmosis", proposalId, voteOption);
        } else {
            return voteOption; // 'Not Voted' or other non-standard status
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getVotingDataOsmosis(votingData) {
    const osmosisAddress = 'osmo1x20lytyf6zkcrv5edpkfkn8sz578qg5saxene9'; // Replace with the actual address
    const chainNameOsmosis = 'Osmosis';
    let currentProposalId = 692; // Start from the specified proposal ID for Osmosis

    while (true) {
        try {
            const proposalStatusOsmosis = await getProposalStatusOsmosis(currentProposalId);
            if (proposalStatusOsmosis === 'Unknown Status') {
                break; // Exit the loop if the proposal status is unknown
            }

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
}

module.exports = { getVotingDataOsmosis };
