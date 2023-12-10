const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const EVMOS_API_ENDPOINT = 'https://evmos-api.validatrium.club';

async function getProposalsInVotingDYDX() {
    try {
        const response = await axios.get(`${EVMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusEvmos(proposalId, address) {
    const uniqueId = `Evmos-${proposalId}`;
    try {
        const url = `${EVMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Evmos", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusEvmos(proposalId) {
    try {
        const url = `${EVMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataEvmos(votingData) {
    const evmosAddress = 'evmos10xhy8xurfwts9ckjkq0ga92mrjz9txyyh2g0t4'; // Replace with the actual address
    const proposalsEvmos = await getProposalsInVotingDYDX();
    const chainNameEvmos = 'Evmos';

    for (const proposal of proposalsEvmos) {
        const voteStatusEvmos = await getVoteStatusEvmos(proposal.id, evmosAddress);
        const proposalStatusEvmos = await getProposalStatusEvmos(proposal.id);

        votingData.push({
            Chain: chainNameEvmos,
            'Proposal ID': proposal.id,
            Vote: voteStatusEvmos,
            Status: proposalStatusEvmos
        });
    }
}

module.exports = { getVotingDataEvmos };
