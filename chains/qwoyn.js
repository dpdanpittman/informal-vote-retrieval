const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const QWOYN_API_ENDPOINT = 'https://api.qwoyn.studio';

async function getProposalsInVotingQwoyn() {
    try {
        const response = await axios.get(`${QWOYN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD`);
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

async function getVoteStatusQwoyn(proposalId, address) {
    const uniqueId = `Qwoyn-${proposalId}`;
    try {
        const url = `${QWOYN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Qwoyn", proposalId, voteOption);
        } else {
            return 'Unspecified';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusQwoyn(proposalId) {
    try {
        const url = `${QWOYN_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataQwoyn(votingData) {
    const qwoynAddress = 'qwoyn1yatzmzt2954c2gq2k7cy4n7s9d9vz56ku3re5v'; // Replace with the actual address
    const proposalsQwoyn = await getProposalsInVotingQwoyn();
    const chainNameQwoyn = 'Qwoyn Network';

    for (const proposal of proposalsQwoyn) {
        const voteStatusQwoyn = await getVoteStatusQwoyn(proposal.id, qwoynAddress);
        const proposalStatusQwoyn = await getProposalStatusQwoyn(proposal.id);

        votingData.push({
            Chain: chainNameQwoyn,
            'Proposal ID': proposal.id,
            Vote: voteStatusQwoyn,
            Status: proposalStatusQwoyn
        });
    }
}

module.exports = { getVotingDataQwoyn };
