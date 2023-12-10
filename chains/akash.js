const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const AKASH_API_ENDPOINT = 'https://api-akash.cosmos-spaces.cloud';

async function getProposalsInVotingAkash() {
    try {
        const response = await axios.get(`${AKASH_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusAkash(proposalId, address) {
    const uniqueId = `Akash-${proposalId}`;
    try {
        const url = `${AKASH_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Akash", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusAkash(proposalId) {
    try {
        const url = `${AKASH_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataAkash(votingData) {
    const akashAddress = 'akash1x20lytyf6zkcrv5edpkfkn8sz578qg5scx8ykd';
    const proposalsAkash = await getProposalsInVotingAkash();
    const chainNameAkash = 'Akash';

    for (const proposal of proposalsAkash) {
        const voteStatusAkash = await getVoteStatusAkash(proposal.id, akashAddress);
        const proposalStatusAkash = await getProposalStatusAkash(proposal.id);

        votingData.push({
            Chain: chainNameAkash,
            'Proposal ID': proposal.id,
            Vote: voteStatusAkash,
            Status: proposalStatusAkash
        });
    }
}

module.exports = { getVotingDataAkash };
