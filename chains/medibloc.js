const axios = require('axios');
const { checkAndStoreVote, handleVoteStatusError } = require('../utils/utils');
const MEDIBLOC_API_ENDPOINT = 'https://panacea-rest.staketab.org';

async function getProposalsInVotingMedibloc() {
    try {
        const response = await axios.get(`${MEDIBLOC_API_ENDPOINT}/cosmos/gov/v1beta1/proposals?proposal_status=2`);
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

async function getVoteStatusMedibloc(proposalId, address) {
    const uniqueId = `Medibloc-${proposalId}`;
    try {
        const url = `${MEDIBLOC_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}/votes/${address}`;
        const response = await axios.get(url);
        const voteData = response.data.vote || {};

        if (voteData.options && voteData.options.length > 0) {
            const voteOption = voteData.options[0].option.replace('VOTE_OPTION_', '').toUpperCase();
            return checkAndStoreVote("Medibloc", proposalId, voteOption);
        } else {
            return 'Not Voted';
        }
    } catch (error) {
        return handleVoteStatusError(uniqueId);
    }
}

async function getProposalStatusMedibloc(proposalId) {
    try {
        const url = `${MEDIBLOC_API_ENDPOINT}/cosmos/gov/v1beta1/proposals/${proposalId}`;
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

async function getVotingDataMedibloc(votingData) {
    const mediblocAddress = 'panacea1vp82lyvjln7lp785dmtrhla9ln05p497slrm3v';
    const proposalsMedibloc = await getProposalsInVotingMedibloc();
    const chainNameMedibloc = 'Medibloc';

    for (const proposal of proposalsMedibloc) {
        const voteStatusMedibloc = await getVoteStatusMedibloc(proposal.id, mediblocAddress);
        const proposalStatusMedibloc = await getProposalStatusMedibloc(proposal.id);

        votingData.push({
            Chain: chainNameMedibloc,
            'Proposal ID': proposal.id,
            Vote: voteStatusMedibloc,
            Status: proposalStatusMedibloc
        });
    }
}

module.exports = { getVotingDataMedibloc };
