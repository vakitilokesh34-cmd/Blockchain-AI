require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: "0.8.19",
    networks: {
        weilchain: {
            url: process.env.WEILCHAIN_RPC,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.WEILCHAIN_CHAIN_ID)
        }
    }
};
