// Blockchain Logging Service (Placeholder until contract is deployed)

const logAction = async (studentHash, action) => {
    console.log(`[BLOCKCHAIN] Emitting event: Action=${action}, Hash=${studentHash}`);

    // Return a mock transaction hash
    return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 40)
    };
};

module.exports = { logAction };
