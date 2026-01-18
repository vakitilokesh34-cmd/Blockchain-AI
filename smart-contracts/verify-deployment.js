const { ethers } = require('hardhat');

async function main() {
  const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  console.log(`Checking deployment at: ${address}`);

  const code = await ethers.provider.getCode(address);

  if (code === '0x') {
    console.log('❌ No contract found at this address.');
  } else {
    console.log('✅ Contract found! Bytecode length:', (code.length - 2) / 2, 'bytes');

    // Try to attach and check name/symbol if it were a token, 
    // but this is WorkflowLog so we just check it exists.
    const WorkflowLog = await ethers.getContractFactory("WorkflowLog");
    const contract = WorkflowLog.attach(address);
    console.log('Contract Name: WorkflowLog');
    console.log('Provider URL:', ethers.provider.connection.url);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
