import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const WorkflowLog = await hre.ethers.getContractFactory("WorkflowLog");
    const workflowLog = await WorkflowLog.deploy();

    await workflowLog.waitForDeployment();

    const address = await workflowLog.getAddress();
    console.log(`WorkflowLog deployed to ${address}`);

    // Save address for backend
    // Note: Backend might not exist or backend folder paths might differ relative to execution
    // We assume standard structure
    try {
        const configPath = path.join(__dirname, '../../backend/blockchain-config.json');
        fs.writeFileSync(configPath, JSON.stringify({
            contractAddress: address,
            network: "localhost"
        }, null, 2));
    } catch (e) {
        console.log("Could not write backend config (folder might not exist yet)", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
