const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const INJECTIVE_API_ENDPOINT = 'https://sentry.lcd.injective.network';

async function getProposalsInVotingInjective() {
    try {
        const response = await axios.get(`${INJECTIVE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD`);
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

async function getVoteStatusInjective(proposalId, address) {
    const uniqueId = `Injective-${proposalId}`;
    try {
        const url = `${INJECTIVE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Injective", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusInjective(proposalId) {
    try {
        const url = `${INJECTIVE_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataInjective(votingData) {
    const injectiveAddress = 'inj10xhy8xurfwts9ckjkq0ga92mrjz9txyylzw9r9';
    const proposalsInjective = await getProposalsInVotingInjective();
    const chainNameInjective = 'Injective';

    for (const proposal of proposalsInjective) {
        const voteStatusInjective = await getVoteStatusInjective(proposal.id, injectiveAddress);
        const proposalStatusInjective = await getProposalStatusInjective(proposal.id);

        votingData.push({
            Chain: chainNameInjective,
            'Proposal ID': proposal.id,
            Vote: voteStatusInjective,
            Status: proposalStatusInjective
        });
    }
}

module.exports = { getVotingDataInjective };
