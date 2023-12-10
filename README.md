# Proposal Voting Data Retrieval App

## Overview

This script is designed to retrieve voting data for proposals on multiple blockchain networks and save it in an ASCII table format. It is especially useful for tracking and monitoring the voting status and outcomes of proposals on various chains.

## Features

- Retrieve voting data for proposals in the voting period.
- Check how a specific address has voted on each proposal.
- Determine the status of each proposal (e.g., Voting Period, Passed, Rejected).
- Save the collected data as an ASCII table for easy viewing and analysis.

## Supported Chains

The script currently supports the following blockchain networks:

- Qwoyn Network
- Osmosis
- Axelar
- Agoric
- Archway
- Celestia
- Coreum
- Cheqd

## Prerequisites

Before using this script, ensure you have the following prerequisites:

- Node.js installed on your system
- Command-line tools for each supported chain (osmosisd for Osmosis)
- Access to the blockchain networks you want to monitor
- Addresses for users whose votes you want to track

## Usage

1. Clone this repository to your local machine.

2. Install the required Node.js packages by running:

   ```bash
   npm install
   ```

3. Configure the script by editing the `chainConfigs` array in the script file. Add details for each chain you want to monitor, including the chain name, command-line tool, user address, and starting proposal number.

4. Run the script using the following command:

   ```bash
   node index.js
   ```

   The script will start retrieving voting data for each chain and saving it as ASCII tables in separate files.

## Script Logic

The script follows these main steps:

1. Retrieve information about proposals in the voting period.
2. For each proposal, check how a specific user has voted.
3. Determine the status of each proposal.
4. Save the collected data as an ASCII table.

## Sample Output

The script will generate ASCII tables like the following for each chain:

```
+---------------------+---------------+-------------------+----------------+
| Chain               | Proposal ID   | Vote              | Status         |
+---------------------+---------------+-------------------+----------------+
| Qwoyn Network       | 13            | YES               | Voting Period  |
| Qwoyn Network       | 14            | Not Voted         | Unknown Status |
| Osmosis             | 692           | YES               | Passed         |
+---------------------+---------------+-------------------+----------------+
```

## Contributing

Feel free to contribute to this script by adding support for more blockchain networks or additional features. Pull requests are welcome!

## License

This script is licensed under the [MIT License](LICENSE).

## Author

Created by [Daniel Pittman](https://github.com/dpdanpittman). You can contact me at daniel.pittman@qwoyn.studio.
