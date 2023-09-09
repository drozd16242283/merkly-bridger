export const sleep = (timeout = 500) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

export const randomIntFromInterval = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

export const hexifyBytes = (hex: string) => {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}