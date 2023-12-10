const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const STRIDE_API_ENDPOINT = 'http://mainnet.regen.network:1317';

async function getProposalsInVotingStride() {
    try {
        const response = await axios.get(`${STRIDE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusStride(proposalId, address) {
    const uniqueId = `Stride-${proposalId}`;
    try {
        const url = `${STRIDE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Regen", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusStride(proposalId) {
    try {
        const url = `${STRIDE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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
        return 'Unknown Status';
    }
}

async function getVotingDataStride(votingData) {
    const strideAddress = 'stride16k579jk6yt2cwmqx9dz5xvq9fug2tekver3f4n';
    const proposalsStride = await getProposalsInVotingStride();
    const chainNameStride = 'Stride';

    for (const proposal of proposalsStride) {
        const voteStatusStride = await getVoteStatusStride(proposal.id, strideAddress);
        const proposalStatusStride = await getProposalStatusStride(proposal.id);

        votingData.push({
            Chain: chainNameStride,
            'Proposal ID': proposal.id,
            Vote: voteStatusStride,
            Status: proposalStatusStride
        });
    }
}

module.exports = { getVotingDataStride };
