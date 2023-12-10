const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const QUICKSILVER_API_ENDPOINT = 'https://panacea-rest.staketab.org';

async function getProposalsInVotingQuicksilver() {
    try {
        const response = await axios.get(`${QUICKSILVER_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusQuicksilver(proposalId, address) {
    const uniqueId = `Quicksilver-${proposalId}`;
    try {
        const url = `${QUICKSILVER_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Quicksilver", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusQuicksilver(proposalId) {
    try {
        const url = `${QUICKSILVER_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataQuicksilver(votingData) {
    const quicksilverAddress = 'quick1x20lytyf6zkcrv5edpkfkn8sz578qg5s7e63k9';
    const proposalsQuicksilver = await getProposalsInVotingQuicksilver();
    const chainNameQuicksilver = 'Quicksilver';

    for (const proposal of proposalsQuicksilver) {
        const voteStatusQuicksilver = await getVoteStatusQuicksilver(proposal.id, quicksilverAddress);
        const proposalStatusQuicksilver = await getProposalStatusQuicksilver(proposal.id);

        votingData.push({
            Chain: chainNameQuicksilver,
            'Proposal ID': proposal.id,
            Vote: voteStatusQuicksilver,
            Status: proposalStatusQuicksilver
        });
    }
}

module.exports = { getVotingDataQuicksilver };
