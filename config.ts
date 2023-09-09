/* 
Source Chain Ids:
    106 = AVAX
    110 = ARB
    111 = Optimism
    109 = Polygon
    102 = BNB
*/

export const Config = {
    SourceChainId: 106, // AVAX

    DestinationChains: [ // Сhain id - https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids
        125, // CELO
        145, // Gnosis
        // 151, // Metis
        175, // Arb Nova
    ],

    ChainIdToProvider: {
        106: 'https://avalanche.public-rpc.com',
        110: 'https://arbitrum-one.public.blastapi.io',
        111: 'https://optimistic.etherscan.io',
        109: 'https://polygon-rpc.com',
        102: 'https://bsc-dataseed.binance.org'
    },

    ChainIdToExplorer: {
        106: 'https://snowtrace.io',
        110: 'https://arbiscan.io',
        111: 'https://mainnet.optimism.io',
        109: 'https://polygonscan.com',
        102: 'https://bscscan.com'
    },

    TimeoutBeforeEachMint: {
        min: 5, // 5 min
        max: 20 // 20 min
    },
    
    TimeoutBeforeEachBridge: { // На багато кошелів зробити більше
        min: 5, // 5 min
        max: 20 // 20 min
    },
    
    TimeoutAfterBridgeFinished: { // На багато кошелів зробити більше
        min: 10, // 10 min
        max: 20 // 20 min
    },

    RetryTxCount: 5,
    TimeoutAfterTxRetry: 1 // 1 min
};