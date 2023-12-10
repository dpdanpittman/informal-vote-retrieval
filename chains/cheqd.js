const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const CHEQD_API_ENDPOINT = 'https://api.cheqd.nodestake.top';

async function getProposalsInVotingCheq() {
    try {
        const response = await axios.get(`${CHEQD_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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
    const uniqueId = `Cheq-${proposalId}`;
    try {
        const url = `${CHEQD_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Cheq", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCheq(proposalId) {
    try {
        const url = `${CHEQD_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataCheq(votingData) {
    const cheqAddress = 'cheqd1x20lytyf6zkcrv5edpkfkn8sz578qg5smlxryx';
    const proposalsCheq = await getProposalsInVotingCheq();
    const chainNameCheq = 'Cheq';

    for (const proposal of proposalsCheq) {
        const voteStatusCheq = await getVoteStatusCheq(proposal.id, cheqAddress);
        const proposalStatusCheq = await getProposalStatusCheq(proposal.id);

        votingData.push({
            Chain: chainNameCheq,
            'Proposal ID': proposal.id,
            Vote: voteStatusCheq,
            Status: proposalStatusCheq
        });
    }
}

module.exports = { getVotingDataCheq };
