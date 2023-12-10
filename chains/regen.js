const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const REGEN_API_ENDPOINT = 'http://mainnet.regen.network:1317';

async function getProposalsInVotingRegen() {
    try {
        const response = await axios.get(`${REGEN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusRegen(proposalId, address) {
    const uniqueId = `Regen-${proposalId}`;
    try {
        const url = `${REGEN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Regen", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusRegen(proposalId) {
    try {
        const url = `${REGEN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataRegen(votingData) {
    const regenAddress = 'regen1kl83t6gm2y5lgg5c5h3sz87tt5fg3cmyrddngu';
    const proposalsRegen = await getProposalsInVotingRegen();
    const chainNameRegen = 'Regen';

    for (const proposal of proposalsRegen) {
        const voteStatusRegen = await getVoteStatusRegen(proposal.id, regenAddress);
        const proposalStatusRegen = await getProposalStatusRegen(proposal.id);

        votingData.push({
            Chain: chainNameRegen,
            'Proposal ID': proposal.id,
            Vote: voteStatusRegen,
            Status: proposalStatusRegen
        });
    }
}

module.exports = { getVotingDataRegen };
