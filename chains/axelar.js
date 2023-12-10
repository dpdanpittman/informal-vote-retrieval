const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const AXELAR_API_ENDPOINT = 'https://axelar-lcd.quickapi.com';

async function getProposalsInVotingAxelar() {
    try {
        const response = await axios.get(`${AXELAR_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusAxelar(proposalId, address) {
    const uniqueId = `Axelar-${proposalId}`;
    try {
        const url = `${AXELAR_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Axelar", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusAxelar(proposalId) {
    try {
        const url = `${AXELAR_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataAxelar(votingData) {
    const axelarAddress = 'axelar1x20lytyf6zkcrv5edpkfkn8sz578qg5s3nutyk';
    const proposalsAxelar = await getProposalsInVotingAxelar();
    const chainNameAxelar = 'Axelar';

    for (const proposal of proposalsAxelar) {
        const voteStatusAxelar = await getVoteStatusAxelar(proposal.id, axelarAddress);
        const proposalStatusAxelar = await getProposalStatusAxelar(proposal.id);

        votingData.push({
            Chain: chainNameAxelar,
            'Proposal ID': proposal.id,
            Vote: voteStatusAxelar,
            Status: proposalStatusAxelar
        });
    }
}

module.exports = { getVotingDataAxelar };
