import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      accounts: {
        count: 102,
      },
    },
  },
  gasReporter: {
    currency: 'USD',
    enabled: true,
  }
};

export default config;
