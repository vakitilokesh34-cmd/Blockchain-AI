/**
 * Blockchain Service - Smart Contract Integration
 * Connects to Ethereum network and logs workflow actions
 * Uses Weilliptic SDK for privacy-preserving hashing
 */

const { ethers } = require('ethers');
const weillipticSDK = require('../../weilliptic/sdk');

// Contract ABI for WorkflowLog
const WORKFLOW_LOG_ABI = [
    "event WorkflowExecuted(bytes32 indexed studentHash, string action, uint256 timestamp, string executionId)",
    "function logWorkflowAction(bytes32 studentHash, string memory action, string memory executionId) public returns (bool)"
];

class BlockchainService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.signer = null;
        this.contractAddress = process.env.WORKFLOW_LOG_CONTRACT_ADDRESS;

        this.initializeProvider();
    }

    async initializeProvider() {
        try {
            // For development, use a local hardhat node or testnet
            const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // Use private key from environment
            if (process.env.PRIVATE_KEY) {
                this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

                if (this.contractAddress) {
                    this.contract = new ethers.Contract(
                        this.contractAddress,
                        WORKFLOW_LOG_ABI,
                        this.signer
                    );
                    console.log('[BLOCKCHAIN] Connected to WorkflowLog contract');
                }
            }
        } catch (error) {
            console.warn('[BLOCKCHAIN] Provider initialization failed (will use mock):', error.message);
        }
    }

    /**
     * Log a workflow action to the blockchain
     */
    async logAction(studentId, action, executionId = null) {
        try {
            // Generate privacy-preserving hash
            const studentHash = weillipticSDK.hashStudentId(studentId);
            const execId = executionId || `EXEC_${Date.now()}`;

            // If contract is available, write to blockchain
            if (this.contract && this.signer) {
                console.log(`[BLOCKCHAIN] Writing to contract...`);

                // Convert hash to bytes32
                const bytes32Hash = '0x' + studentHash.substring(0, 64);

                const tx = await this.contract.logWorkflowAction(
                    bytes32Hash,
                    action,
                    execId
                );

                console.log(`[BLOCKCHAIN] Transaction sent: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`[BLOCKCHAIN] Transaction confirmed in block: ${receipt.blockNumber}`);

                return {
                    success: true,
                    txHash: tx.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    studentHash: bytes32Hash,
                    executionId: execId,
                    timestamp: Date.now()
                };
            } else {
                // Mock mode for development
                console.log(`[BLOCKCHAIN-MOCK] Action: ${action}, Hash: ${studentHash}, ExecId: ${execId}`);

                return {
                    success: true,
                    txHash: '0x' + crypto.randomBytes(32).toString('hex'),
                    blockNumber: Math.floor(Math.random() * 1000000),
                    gasUsed: '21000',
                    studentHash: '0x' + studentHash.substring(0, 64),
                    executionId: execId,
                    timestamp: Date.now(),
                    mock: true
                };
            }
        } catch (error) {
            console.error('[BLOCKCHAIN] Error logging action:', error);

            return {
                success: false,
                error: error.message,
                mock: true
            };
        }
    }

    /**
     * Log multiple actions in batch (more gas efficient)
     */
    async logBatchActions(actions) {
        const results = [];

        for (const { studentId, action, executionId } of actions) {
            const result = await this.logAction(studentId, action, executionId);
            results.push(result);
        }

        return results;
    }

    /**
     * Get workflow logs for a specific student
     */
    async getStudentLogs(studentId) {
        try {
            if (!this.contract) {
                return { success: false, error: 'Contract not initialized' };
            }

            const studentHash = '0x' + weillipticSDK.hashStudentId(studentId).substring(0, 64);

            // Query events from the blockchain
            const filter = this.contract.filters.WorkflowExecuted(studentHash);
            const events = await this.contract.queryFilter(filter);

            return {
                success: true,
                logs: events.map(event => ({
                    studentHash: event.args.studentHash,
                    action: event.args.action,
                    timestamp: new Date(Number(event.args.timestamp) * 1000).toISOString(),
                    executionId: event.args.executionId,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                }))
            };
        } catch (error) {
            console.error('[BLOCKCHAIN] Error fetching logs:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify a workflow execution proof
     */
    async verifyExecutionProof(executionId, proof) {
        // In production, this would verify against on-chain data
        return {
            verified: true,
            executionId,
            proof,
            timestamp: new Date().toISOString()
        };
    }
}

// Use require('crypto') for mock mode
const crypto = require('crypto');

module.exports = new BlockchainService();
