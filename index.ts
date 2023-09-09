import fs from 'fs';
import process from 'process';
import { ethers } from 'ethers';

import { log, Colors } from './logger';
import { AsyncQueue, Mutex } from './async_queue';
import { Config } from './config';

import { Merkly } from './merkly';

// Ignore promise rejection
process.on('unhandledRejection', (err) => {
    log(Colors.Red, '\n!!!!! An unhandledRejection occurred !!!!! \n');
    log(Colors.Red, `!!! Rejection: ${err}`);
});

class MerklyBridger {
    private merkly: Merkly;

    constructor() {
        const provider = Config.ChainIdToProvider[Config.SourceChainId];
        if (!provider) {
            throw new Error('Failed to init script: Provider required!')
        }

        this.merkly = new Merkly(new ethers.providers.JsonRpcProvider(provider));

        void this.initProcessing(
            this.populateProcessQueue(
                this.loadWallets()
            )
        );
    }

    private loadWallets(): string[] {
        try {
            const wallets = fs
                .readFileSync('./private_keys.txt', { encoding: 'utf-8' })
                .split('\n')
                .filter(Boolean);

            return this.shuffleArray(wallets);
        } catch (err) {
            throw Error('Failed to load wallets!');
        }
    }

    private populateProcessQueue(wallets: string[]) {
        const queue = [];

        for (const wallet of wallets) {
            const asyncQueue = new AsyncQueue(new Mutex());
            
            this.shuffleArray<number>(Config.DestinationChains).forEach((destId) => {
                asyncQueue.add(() => this.merkly.process(wallet, Config.SourceChainId, destId));
            })

            queue.push(asyncQueue);
        }

        return queue;
    }

    private async initProcessing(queue) {
        log(Colors.Magenta, `Start processing...wallets count - ${queue.length} \n\n`);

        await Promise.allSettled(queue);
    }

    private shuffleArray<T>(array: T[]): T[] {
        const copyTokensArray = array;
        let currentIndex = copyTokensArray.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [copyTokensArray[currentIndex], copyTokensArray[randomIndex]] = [copyTokensArray[randomIndex], copyTokensArray[currentIndex]];
        }

        return copyTokensArray;
    }
}


const merkly = new MerklyBridger();