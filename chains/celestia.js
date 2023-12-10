const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const CELESTIA_API_ENDPOINT = 'https://rest-celestia.theamsolutions.info';

async function getProposalsInVotingCelestia() {
    try {
        const response = await axios.get(`${CELESTIA_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusCelestia(proposalId, address) {
    const uniqueId = `Celestia-${proposalId}`;
    try {
        const url = `${CELESTIA_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Celestia", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCelestia(proposalId) {
    try {
        const url = `${CELESTIA_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataCelestia(votingData) {
    const celestiaAddress = 'celestia1x20lytyf6zkcrv5edpkfkn8sz578qg5syhmn46';
    const proposalsCelestia = await getProposalsInVotingCelestia();
    const chainNameCelestia = 'Celestia';

    for (const proposal of proposalsCelestia) {
        const voteStatusCelestia = await getVoteStatusCelestia(proposal.id, celestiaAddress);
        const proposalStatusCelestia = await getProposalStatusCelestia(proposal.id);

        votingData.push({
            Chain: chainNameCelestia,
            'Proposal ID': proposal.id,
            Vote: voteStatusCelestia,
            Status: proposalStatusCelestia
        });
    }
}

module.exports = { getVotingDataCelestia };
