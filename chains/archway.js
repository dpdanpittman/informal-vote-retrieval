const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const ARCHWAY_API_ENDPOINT = 'https://api.mainnet.archway.io';

async function getProposalsInVotingArchway() {
    try {
        const response = await axios.get(`${ARCHWAY_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusArchway(proposalId, address) {
    const uniqueId = `Archway-${proposalId}`;
    try {
        const url = `${ARCHWAY_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Archway", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusArchway(proposalId) {
    try {
        const url = `${ARCHWAY_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataArchway(votingData) {
    const archwayAddress = 'archway1x20lytyf6zkcrv5edpkfkn8sz578qg5sqkk89q'; // Replace with the actual address
    const proposalsArchway = await getProposalsInVotingArchway();
    const chainNameArchway = 'Archway';

    for (const proposal of proposalsArchway) {
        const voteStatusArchway = await getVoteStatusArchway(proposal.id, archwayAddress);
        const proposalStatusArchway = await getProposalStatusArchway(proposal.id);

        votingData.push({
            Chain: chainNameArchway,
            'Proposal ID': proposal.id,
            Vote: voteStatusArchway,
            Status: proposalStatusArchway
        });
    }
}

module.exports = { getVotingDataArchway };
