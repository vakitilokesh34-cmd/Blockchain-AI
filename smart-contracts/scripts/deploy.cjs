const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const WorkflowLog = await hre.ethers.getContractFactory("WorkflowLog");
    const workflowLog = await WorkflowLog.deploy();

    await workflowLog.waitForDeployment();

    const address = await workflowLog.getAddress();
    console.log(`WorkflowLog deployed to ${address}`);

    // Save address for backend
    try {
        const configPath = path.join(__dirname, '../../backend/blockchain-config.json');
        fs.writeFileSync(configPath, JSON.stringify({
            contractAddress: address,
            network: hre.network.name
        }, null, 2));
        console.log(`Contract address saved to ${configPath}`);
    } catch (e) {
        console.log("Could not write backend config:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
