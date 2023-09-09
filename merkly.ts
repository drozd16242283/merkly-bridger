import { ethers } from "ethers";

import { MerklyAbi__factory, MerklyAbi } from "./typechain";
import { Colors, log } from "./logger";
import { Config } from "./config";
import { sleep, randomIntFromInterval, hexifyBytes } from "./utils";

const MERKLY_ADDRESS = '0xE030543b943bdCd6559711Ec8d344389C66e1D56';

export class Merkly {
    provider: ethers.providers.JsonRpcProvider;

    approvedWalletsMap: Record<string, boolean> = {};

    constructor(provider: ethers.providers.JsonRpcProvider) {
        this.provider = provider;
    }

    async process(wallet: string, sourceChainId: number, destinationChainId: number): Promise<void> {
        const signer = new ethers.Wallet(wallet, this.provider);

        const router: MerklyAbi = await MerklyAbi__factory.connect(MERKLY_ADDRESS, signer);

        await sleep(1000 * 60 * randomIntFromInterval(Config.TimeoutBeforeEachMint.min, Config.TimeoutBeforeEachMint.max));

        let nftId;
        try {
            nftId = await this._mint(signer, router, sourceChainId);
        } catch (err) {
            log(Colors.Red, `Failed to Mint nft for wallet ${signer.address}`);
            return;
        }

        if (!nftId) {
            log(Colors.Red, `Failed to get NFT id for bridge. Wallet - ${signer.address}`);
        }

        await sleep(1000 * 60 * randomIntFromInterval(Config.TimeoutBeforeEachBridge.min, Config.TimeoutBeforeEachBridge.max));

        try {
            await this._bridge(signer, router, nftId, sourceChainId, destinationChainId);
        } catch (err) {
            log(Colors.Red, `Failed to bridge nft for wallet ${signer.address}`);
            return;
        }

        await sleep(1000 * 60 * randomIntFromInterval(Config.TimeoutAfterBridgeFinished.min, Config.TimeoutAfterBridgeFinished.max));
    }

    private async _mint(signer: ethers.Wallet, router: MerklyAbi, sourceChainId: number): Promise<number> {
        let txHash;

        const feeData = await this.provider.getFeeData();
        const mintFee = await router.fee()

        try {
            const mintTx = await router.mint({ gasPrice: feeData.gasPrice, value: mintFee });

            await mintTx.wait(1);

            txHash = mintTx.hash;
        } catch (err) {
            log(Colors.Red, `Failed to Mint NFT for wallet ${signer.address} Retrying....`);

            let counter = 0;
            while (counter <= Config.RetryTxCount) {
                let hash;
                    // Ignore error, retry again
                try {
                    hash = await router.mint({ gasPrice: feeData.gasPrice, value: mintFee });
                } catch (err) {}
                
                if (hash) {
                    txHash = hash;
                    counter = Config.RetryTxCount;
                }
                await sleep(1000 * 60 * Config.TimeoutAfterTxRetry);
                counter++;
            }
        }

        if (txHash) {
            const nftId = await this._getNftIdFromTransaction(txHash, signer.address);

            log(Colors.Green, `\nSuccessfull Mint NFT ${nftId} for wallet ${signer.address} tx - ${Config.ChainIdToExplorer[sourceChainId]}/tx/${txHash} \n`);

            return nftId;
        }
    }

    private async _bridge(signer: ethers.Wallet, router: MerklyAbi, nftId: number, sourceChainId: number, destinationChainId: number): Promise<void> {
        const adapterParams = hexifyBytes('00010000000000000000000000000000000000000000000000000000000000061a80');

        let fee;
        try {
            const fees = await router.estimateSendFee(destinationChainId, MERKLY_ADDRESS, nftId, false, adapterParams);
            fee = fees[0];
        } catch (error) {
            log(Colors.Red, `\nFailed to estimate fee for bridge. Wallet - ${signer.address} Error - ${error.reason} \n`);
            return;
        }

        const feeData = await this.provider.getFeeData();
        
        let txHash;
        try {
            const bridgeTx = await router.sendFrom(signer.address, destinationChainId, signer.address, nftId, signer.address, '0x0000000000000000000000000000000000000000', adapterParams, {
                from: signer.address,
                value: fee,
                gasLimit: 500000,
                gasPrice: feeData.gasPrice
            });

            await bridgeTx.wait(1);

            txHash = bridgeTx.hash;
        } catch (err) {
            log(Colors.Red, `\nFailed to Bridge NFT ${nftId} to dest chain ${destinationChainId}. Wallet - ${signer.address} Retrying.... \n`);

            // retry
            let counter = 0;
            while (counter <= Config.RetryTxCount) {
                let hash;
                    // Ignore error, retry again
                try {
                    hash = await router.sendFrom(signer.address, destinationChainId, signer.address, nftId, signer.address, '0x0000000000000000000000000000000000000000', adapterParams, {
                        from: signer.address,
                        value: fee,
                        gasLimit: 500000,
                        gasPrice: feeData.gasPrice
                    });
                } catch (err) {}
                
                if (hash) {
                    txHash = hash;
                    counter = Config.RetryTxCount;
                }
                await sleep(1000 * 60 * Config.TimeoutAfterTxRetry);
                counter++;
            }
        }

        if (txHash) {
            log(Colors.Green, `\nSuccessfull Bridge NFT ${nftId} to dest chain ${destinationChainId} for wallet ${signer.address} tx - ${Config.ChainIdToExplorer[sourceChainId]}/tx/${txHash} \n`);
        }
    }

    private async _getNftIdFromTransaction(txHash: string, walletAddress: string): Promise<number> {
        try {
            const txData = await this.provider.getTransactionReceipt(txHash);

            const transferLog = txData.logs.pop();
            const nftIdLogTopic = transferLog.topics?.pop();
    
            return parseInt(nftIdLogTopic);
        } catch (err) {
            log(Colors.Red, `\nFailed to parse NFT id from TX. Wallet - ${walletAddress} \n`);
            return;
        }
    }
}