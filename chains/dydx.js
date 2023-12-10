const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const DYDX_API_ENDPOINT = 'https://dydx-mainnet-full-lcd.public.blastapi.io';

async function getProposalsInVotingDYDX() {
    try {
        const response = await axios.get(`${DYDX_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusDYDX(proposalId, address) {
    const uniqueId = `DYDX-${proposalId}`;
    try {
        const url = `${DYDX_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("DYDX", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusDYDX(proposalId) {
    try {
        const url = `${DYDX_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataDYDX(votingData) {
    const dydxAddress = 'dydx1x20lytyf6zkcrv5edpkfkn8sz578qg5suyy80q'; // Replace with the actual address
    const proposalsDYDX = await getProposalsInVotingDYDX();
    const chainNameDYDX = 'DYDX';

    for (const proposal of proposalsDYDX) {
        const voteStatusDYDX = await getVoteStatusDYDX(proposal.id, dydxAddress);
        const proposalStatusDYDX = await getProposalStatusDYDX(proposal.id);

        votingData.push({
            Chain: chainNameDYDX,
            'Proposal ID': proposal.id,
            Vote: voteStatusDYDX,
            Status: proposalStatusDYDX
        });
    }
}

module.exports = { getVotingDataDYDX };
