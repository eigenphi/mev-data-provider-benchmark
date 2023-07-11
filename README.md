# mev-data-provider-benchmark README
## Project Overview
This project is a benchmarking and aggregation tool for MEV data providers. The tool records the exact time when pendingTransactions are received from each provider and matches professional real-time MEV data from https://eigenphi.io to identify high-value transactions and data sources.

## Features
- Benchmarking: The tool records the time it takes for each provider to receive and process pendingTransactions.  
- Data Aggregation: The tool aggregates MEV data from multiple providers and combines it into a single, comprehensive data stream.  
- Professional Data Source: The tool uses real-time MEV data from https://eigenphi.io to identify high-value transactions and data sources.

## Getting Started
To get started, download the latest version of the application from the project's GitHub repository:
```shell 
git clone https://github.com/eigenphi/mev-data-provider-benchmark.git
```
Next, run the following command in the terminal to build the application:
```shell 
npm install && npm build
```
Then, set provider's apikey in user environment following ```.env.example```
Finally, run the application by:
```shell
npm run start
```
## Usage
To use the application, follow these steps:
1. Configure the tool with your provider's API credentials following ```.env.example```.
2. Start the process.  
3. Connect to WebSocket: ```ws:\\localhost:8080``` to receive aggregated data stream.
4. Analyze the results in ```.\logs```.
## Contributing
Contributions to the project are welcome! To contribute, please fork the repository and make your changes. Once you have completed your changes, submit a pull request to the original repository.
## License
This project is licensed under the MIT License.
## Contact
For any questions or concerns, please reach out to the project maintainer at:

- GitHub: https://github.com/eigenphi/mev-data-provider-benchmark

Thank you for your interest in this project!