const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the directory of the current module (utils.js)
const currentDir = __dirname;

// Construct the correct path to initialVotes.json
const initialVotesPath = path.join(currentDir, '../data/initialVotes.json');

// Run a command and return the output
async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {;
                return reject(error);
            }
            if (stderr) {
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}

// Extract the vote option from vote data
function extractVoteOption(voteData) {
    if (!voteData || !voteData.option) {
        return 'Not Voted';
    }
    return voteData.option.toUpperCase();
}

// Check and store the vote in the initialVotes.json file
function checkAndStoreVote(chainName, proposalId, voteOption) {
    const uniqueId = `${chainName}-${proposalId}`;
    const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));

    if (storedVotes.hasOwnProperty(uniqueId)) {
        if (storedVotes[uniqueId] !== voteOption) {
            console.error(`Vote change detected for ${uniqueId}. Stored: ${storedVotes[uniqueId]}, Current: ${voteOption}`);
        }
    } else if (['YES', 'NO', 'ABSTAIN', `NO WITH VETO`].includes(voteOption)) {
        storedVotes[uniqueId] = voteOption;
        fs.writeFileSync(initialVotesPath, JSON.stringify(storedVotes), 'utf8');
    }

    return voteOption;
}

// Handle vote status errors
function handleVoteStatusError(uniqueId) {
    const storedVotes = JSON.parse(fs.readFileSync(initialVotesPath, 'utf8'));
    if (storedVotes.hasOwnProperty(uniqueId)) {
        return storedVotes[uniqueId];
    } else {
        return 'Not Voted';
    }
}

// Format data as an ASCII table
function formatAsAsciiTable(data) {
    let table = '';
    const headers = ['Chain', 'Proposal ID', 'Vote', 'Status'];
    const columnWidths = [20, 15, 30, 20];

    headers.forEach((header, index) => {
        table += header.padEnd(columnWidths[index], ' ') + '|';
    });
    table += '\n';

    columnWidths.forEach(width => {
        table += ''.padEnd(width, '-') + '+';
    });
    table += '\n';

    data.forEach(row => {
        table += `${row.Chain.padEnd(columnWidths[0], ' ')}|${row['Proposal ID'].toString().padEnd(columnWidths[1], ' ')}|${String(row.Vote).padEnd(columnWidths[2], ' ')}|${String(row.Status).padEnd(columnWidths[3], ' ')}|\n`;
    });

    return table;
}

module.exports = { runCommand, extractVoteOption, checkAndStoreVote, handleVoteStatusError, formatAsAsciiTable };
