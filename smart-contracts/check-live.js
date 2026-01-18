const { ethers } = require('ethers');

async function main() {
  const rpcUrl = 'http://127.0.0.1:8545/';
  const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  console.log('--- WEIL CHAIN DEPLOYMENT STATUS ---');
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Contract: ${address}`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const code = await provider.getCode(address);
    const balance = await provider.getBalance(address);
    const blockNumber = await provider.getBlockNumber();
    const chainId = (await provider.getNetwork()).chainId;

    console.log(`\n✅ Network Connected!`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Current Block: ${blockNumber}`);

    if (code !== '0x') {
      console.log(`\n✅ Contract is LIVE!`);
      console.log(`Bytecode: Detected (${(code.length - 2) / 2} bytes)`);
      console.log(`Balance: ${ethers.formatEther(balance)} WEIL`);
    } else {
      console.log(`\n❌ No contract found at this address on this network.`);
    }
  } catch (error) {
    console.error(`\n❌ Connection Failed: ${error.message}`);
  }
  console.log('-----------------------------------');
}

main();
