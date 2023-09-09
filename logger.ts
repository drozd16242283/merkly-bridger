export enum Colors {
    Blue = 'Blue',
    Red = 'Red',
    Yellow = 'Yellow',
    Magenta = 'Magenta',
    Green = 'Green',
    Gray = 'Gray',
}

const colorsToCodeMap = {
    [Colors.Blue]: '34',
    [Colors.Red]: '31',
    [Colors.Yellow]: '33',
    [Colors.Magenta]: '35',
    [Colors.Green]: '32',
    [Colors.Gray]: '90',
}

export const log = (color: Colors, text: string) => {
    console.log(`\x1b[${colorsToCodeMap[color]}m%s\x1b[0m`, text);
}
