import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
// const mnemonic = "";

dotenv.config();

const infura_api_key = process.env.INFURA_API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    // hardhat: {
    //   // accounts: {
    //   //   mnemonic,
    //   // },
    //   chainId: 1337
    // },
    // localhost: {
    //   url: "http://127.0.0.1:8545",
    // },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infura_api_key}`,
      accounts: ["ab7e9831d92d430c8731cf586ecfc5e3ce1569a3508e3679c243d2df4885db86"],
      // httpHeaders: {
      //   Authorization: `Basic ${Buffer.from(":" + infura_api_secret).toString("base64")}`,
      // },
    },
    // gasReporter: {
    //   enabled: process.env.REPORT_GAS !== undefined,
    //   currency: "USD",
    // },
    // etherscan: {
    //   apiKey: process.env.ETHERSCAN_API_KEY,
    // },
  },
};

export default config;
