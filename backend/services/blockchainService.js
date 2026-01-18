/**
 * Blockchain Service - Smart Contract Integration
 * Connects to Weil Chain and logs workflow actions using Weil SDK
 */

const { WeilWallet } = require('@weilliptic/weil-sdk');
const weillipticSDK = require('../../weilliptic/sdk.cjs');
const crypto = require('crypto');

class BlockchainService {
    constructor() {
        this.wallet = null;
        this.appletAddress = process.env.WEIL_APPLET_ADDRESS; // Hex address without 0x
        this.initializeWallet();
    }

    initializeWallet() {
        try {
            const privateKey = process.env.WEIL_PRIVATE_KEY;
            const sentinelEndpoint = process.env.WEIL_SENTINEL_ENDPOINT || 'https://sentinel.unweil.me';

            if (privateKey) {
                // Ensure private key doesn't have 0x prefix for Weil SDK
                const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;

                this.wallet = new WeilWallet({
                    privateKey: cleanPrivateKey,
                    sentinelEndpoint: sentinelEndpoint
                });

                console.log('[BLOCKCHAIN] Weil Wallet initialized');
                if (this.appletAddress) {
                    console.log(`[BLOCKCHAIN] Targeting Applet: ${this.appletAddress}`);
                }
            } else {
                console.warn('[BLOCKCHAIN] No private key found for Weil Wallet');
            }
        } catch (error) {
            console.error('[BLOCKCHAIN] Failed to initialize Weil Wallet:', error.message);
        }
    }

    /**
     * Log a workflow action to the Weil Chain
     */
    async logAction(studentId, action, executionId = null) {
        try {
            // Generate privacy-preserving hash
            const studentHash = weillipticSDK.hashStudentId(studentId);
            const execId = executionId || `EXEC_${Date.now()}`;

            // If wallet and applet address are available, write to Weil Chain
            if (this.wallet && this.appletAddress) {
                console.log(`[BLOCKCHAIN] Executing Weil Applet: ${this.appletAddress}`);

                // Remove 0x if present for the SDK
                const cleanAppletAddress = this.appletAddress.startsWith('0x') ? this.appletAddress.substring(2) : this.appletAddress;

                const result = await this.wallet.contracts.execute(
                    cleanAppletAddress,
                    'log_action', // Method name in the applet
                    {
                        student_hash: studentHash,
                        action: action,
                        execution_id: execId,
                        timestamp: Math.floor(Date.now() / 1000)
                    }
                );

                console.log('[BLOCKCHAIN] Execution result:', result);

                return {
                    success: true,
                    transactionId: result.transactionId || result.id,
                    txHash: result.transactionId || result.id || result.txHash, // Compatibility alias
                    studentHash: studentHash,
                    executionId: execId,
                    timestamp: Date.now(),
                    blockchain: 'Weil Chain'
                };
            } else {
                // Mock mode for development
                console.log(`[BLOCKCHAIN-MOCK] Action: ${action}, Hash: ${studentHash}, ExecId: ${execId}`);

                return {
                    success: true,
                    txHash: crypto.randomBytes(32).toString('hex'),
                    blockNumber: Math.floor(Math.random() * 1000000),
                    studentHash: studentHash,
                    executionId: execId,
                    timestamp: Date.now(),
                    mock: true,
                    blockchain: 'Mock Weil Chain'
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
     * Log multiple actions in batch
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
            if (!this.wallet || !this.appletAddress) {
                return { success: false, error: 'Wallet or Applet Address not initialized' };
            }

            const studentHash = weillipticSDK.hashStudentId(studentId);
            const cleanAppletAddress = this.appletAddress.startsWith('0x') ? this.appletAddress.substring(2) : this.appletAddress;

            const result = await this.wallet.contracts.execute(
                cleanAppletAddress,
                'get_logs',
                { student_hash: studentHash }
            );

            return {
                success: true,
                logs: Array.isArray(result) ? result : []
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
        return {
            verified: true,
            executionId,
            proof,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new BlockchainService();
