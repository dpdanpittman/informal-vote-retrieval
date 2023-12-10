const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const COSMOS_API_ENDPOINT = 'https://api-cosmoshub-ia.cosmosia.notional.ventures';

async function getProposalsInVotingCosmos() {
    try {
        const response = await axios.get(`${COSMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusCosmos(proposalId, address) {
    const uniqueId = `CosmosHub-${proposalId}`;
    try {
        const url = `${COSMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("CosmosHub", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        console.error(`Failed to get vote status for proposal ${proposalId}:`, error);
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusCosmos(proposalId) {
    try {
        const url = `${COSMOS_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataCosmos(votingData) {
    const cosmosAddress = 'cosmos16k579jk6yt2cwmqx9dz5xvq9fug2tekv6g34pl'; // Replace with the actual address
    const proposalsCosmos = await getProposalsInVotingCosmos();
    const chainNameCosmos = 'Cosmos Hub';

    for (const proposal of proposalsCosmos) {
        const voteStatusCosmos = await getVoteStatusCosmos(proposal.id, cosmosAddress);
        const proposalStatusCosmos = await getProposalStatusCosmos(proposal.id);

        votingData.push({
            Chain: chainNameCosmos,
            'Proposal ID': proposal.id,
            Vote: voteStatusCosmos,
            Status: proposalStatusCosmos
        });
    }
}

module.exports = { getVotingDataCosmos };
