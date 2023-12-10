const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const JUNO_API_ENDPOINT = 'https://lcd-juno.validavia.me';

async function getProposalsInVotingJuno() {
    try {
        const response = await axios.get(`${JUNO_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD`);
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

async function getVoteStatusJuno(proposalId, address) {
    const uniqueId = `Juno-${proposalId}`;
    try {
        const url = `${JUNO_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Juno", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusJuno(proposalId) {
    try {
        const url = `${JUNO_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataJuno(votingData) {
    const junoAddress = 'juno1x20lytyf6zkcrv5edpkfkn8sz578qg5sr0fcgt';
    const proposalsJuno = await getProposalsInVotingJuno();
    const chainNameJuno = 'Juno';

    for (const proposal of proposalsJuno) {
        const voteStatusJuno = await getVoteStatusJuno(proposal.id, junoAddress);
        const proposalStatusJuno = await getProposalStatusJuno(proposal.id);

        votingData.push({
            Chain: chainNameJuno,
            'Proposal ID': proposal.id,
            Vote: voteStatusJuno,
            Status: proposalStatusJuno
        });
    }
}

module.exports = { getVotingDataJuno };
