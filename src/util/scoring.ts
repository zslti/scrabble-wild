import { TileData, getLetterMultiplier, getTileID, getWordMultiplier } from "../components/tile";
import { Lobby } from "./firebase";
import { languages } from "./languages";
import { isValidWord } from "./words";

export const letterScores = {
    'en': {
        'a': 1, 'b': 3, 'c': 3, 'd': 2, 'e': 1, 'f': 4, 'g': 2, 'h': 4, 'i': 1, 'j': 8, 'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1, 'p': 3, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 4, 'w': 4, 'x': 8, 'y': 4, 'z': 10, '*': 0
    },
    'hu': {
        'a': 1, 'á': 1, 'b': 2, 'c': 5, 'd': 2, 'e': 1, 'é': 3, 'f': 4, 'g': 2, 'h': 3, 'i': 1, 'í': 5, 'j': 4, 'k': 1, 'l': 1, 'm': 1, 'n': 1, 'o': 1, 'ó': 2, 'ö': 4, 'ő': 7, 'p': 4, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 4, 'ú': 7, 'ü': 4, 'ű': 7, 'v': 3, 'w': 10, 'x': 10, 'y': 3, 'z': 4, '*': 0
    }
}

export const startingLetters = {
    'en': 'aaaaaaaaabbccddddeeeeeeeeeeeeffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrssssttttttuuuuvvwwxyyz**',
    'hu': 'cínycsőúűlyzsty**hhszszvvffgygyjjööppuuüüzziiimmmooosssbbbdddgggóóóéééáááállllnnnnrrrrtttttaaaaaaeeeeeekkkkkk'
}

export function getLetterScore(letter: string, language: keyof typeof letterScores) {
    const l = letter as keyof typeof letterScores[typeof language];
    return letterScores[language][l];
}

function isConnected(tileData: TileData[][], row: number, column: number) {
    if(row > 0 && tileData[row-1][column].letter != '' && tileData[row-1][column].letter != null) return true;
    if(row < tileData.length-1 && tileData[row+1][column].letter != '' && tileData[row+1][column].letter != null) return true;
    if(column > 0 && tileData[row][column-1].letter != '' && tileData[row][column-1].letter != null) return true;
    if(column < tileData[row].length-1 && tileData[row][column+1].letter != '' && tileData[row][column+1].letter != null) return true;
    return false;
}

function isConnectedToFinalizedTile(tileData: TileData[][], row: number, column: number, tileChanges: Map<string, TileData>, direction?: 'horizontal' | 'vertical') {
    if(direction == undefined || direction == 'horizontal') {
        if(row > 0 && tileData[row-1][column].isFinalized && !tileChanges.has(getTileID(row-1, column))) return true;
        if(row < tileData.length-1 && tileData[row+1][column].isFinalized && !tileChanges.has(getTileID(row+1, column))) return true;
    }
    if(direction == undefined || direction == 'vertical') {
        if(column > 0 && tileData[row][column-1].isFinalized && !tileChanges.has(getTileID(row, column-1))) return true;
        if(column < tileData[row].length-1 && tileData[row][column+1].isFinalized && !tileChanges.has(getTileID(row, column+1))) return true;
    }
    return false;
}

export function getCurrentRoundPlayer(lobbyData: Lobby) {
    if(!lobbyData || lobbyData.round === undefined) return '';
    return lobbyData.players[lobbyData.round % lobbyData.players.length];
}

export function isCurrentRound(lobbyData: Lobby, username: string) {
    return getCurrentRoundPlayer(lobbyData) == username;
}

export function getCurrentRoundText(lobbyData: Lobby, username: string) {
    if(lobbyData.round === undefined) return '';
    if(isCurrentRound(lobbyData, username)) return 'Your';
    return `${getCurrentRoundPlayer(lobbyData)}'s`;
}

interface Word {
    word: string;
    startPosition: {row: number, column: number};
    endPosition: {row: number, column: number};
    direction: 'horizontal' | 'vertical';
}

function getWordStartingAt(tileData: TileData[][], row: number, column: number, direction: 'horizontal' | 'vertical') {
    let word = '';
    const startPos = {row, column};
    if(direction == 'horizontal') {
        if(column > 0 && tileData[row][column-1].letter != '' && tileData[row][column-1].letter != null) return null;
        while(column < tileData.length && tileData[row][column].letter != '' && tileData[row][column].letter != null) {
            word += tileData[row][column].letter;
            column++;
        }
        column--;
    } else {
        if(row > 0 && tileData[row-1][column].letter != '' && tileData[row-1][column].letter != null) return null;
        while(row < tileData.length && tileData[row][column].letter != '' && tileData[row][column].letter != null) {
            word += tileData[row][column].letter;
            row++;
        }
        row--;
    }
    if(word.length <= 1) return null;
    return {word, startPosition: startPos, endPosition: {row, column}, direction};
}

function isWordAffectedByTileChanges(word: Word, tileChanges: Map<string, TileData>) {
    for(let row = word.startPosition.row; row <= word.endPosition.row; row++) {
        for(let column = word.startPosition.column; column <= word.endPosition.column; column++) {
            if(tileChanges.has(getTileID(row, column))) return true;
        }
    }
    return false;
}

function getScore(words: Word[], tileData: TileData[][], tileChanges: Map<string, TileData>, lobbyData: Lobby) {
    let score = 0;
    let wordsUsedForScoring: string[] = [];
    words.forEach((word) => {
        if(!isWordAffectedByTileChanges(word, tileChanges)) return;
        let p = 0;
        let m = 1;
        for(let row = word.startPosition.row; row <= word.endPosition.row; row++) {
            for(let column = word.startPosition.column; column <= word.endPosition.column; column++) {
                p += getLetterMultiplier(tileData[row][column]) * getLetterScore((tileData[row][column].letter ?? ''), lobbyData.settings.language as keyof typeof languages);
                m *= getWordMultiplier(tileData[row][column]);
            }
        }
        score += p * m;
        wordsUsedForScoring.push(word.word);
    });
    return [score, wordsUsedForScoring];
}

export function isFinalizable(lobbyData: Lobby, tileChanges: Map<string, TileData>, username: string) {
    if(tileChanges.size === 0) return [false, undefined];
    const tileData = JSON.parse(lobbyData.tiles) as TileData[][];
    tileChanges.forEach((tile) => {
        tileData[tile.row][tile.column] = tile;
        tileData[tile.row][tile.column].isFinalized = true;
    });
    // check if the tile isnt connected to any other tile, if it is connected to a previous word
    let connectedToPreviousWord = false;
    for(let row = 0; row < tileData.length; row++) {
        for(let column = 0; column < tileData[row].length; column++) {
            if(tileData[row][column].letter != '' && tileData[row][column].letter != null && !isConnected(tileData, row, column)) {
                return [false, 'Invalid placement'];
            }
            if(!connectedToPreviousWord && tileChanges.has(getTileID(row, column)) && tileData[row][column].letter != '' 
                && tileData[row][column].letter != null && isConnectedToFinalizedTile(tileData, row, column, tileChanges)) {
                connectedToPreviousWord = true;
            }
        }
    }
    if(lobbyData.round == 0) connectedToPreviousWord = true;
    if(!connectedToPreviousWord && lobbyData.wasFirstWordPlaced) return [false, 'Invalid placement'];
    // check if the tiles are all in the same row or column
    let rows = new Set<number>();
    let columns = new Set<number>();
    tileChanges.forEach((tile) => {
        rows.add(tile.row);
        columns.add(tile.column);
    });
    if(rows.size > 1 && columns.size > 1) return [false, 'Invalid placement'];
    
    // get all words and check if they are valid
    let words: Word[] = [];
    for(let row = 0; row < tileData.length; row++) {
        for(let column = 0; column < tileData[row].length; column++) {
            const horizontalWord = getWordStartingAt(tileData, row, column, 'horizontal');
            const verticalWord = getWordStartingAt(tileData, row, column, 'vertical');
            if(horizontalWord) {
                if(!isValidWord(horizontalWord.word, lobbyData.settings.language as keyof typeof languages)) return [false, 'Invalid word'];
                words.push(horizontalWord);
            }
            if(verticalWord) {
                if(!isValidWord(verticalWord.word, lobbyData.settings.language as keyof typeof languages)) return [false, 'Invalid word'];
                words.push(verticalWord);
            }
        }
    }

    // check if the word needs to be connected to the center
    if(!lobbyData.wasFirstWordPlaced) {
        let middleTile: number = Math.floor(tileData.length / 2);
        if(lobbyData.settings.boardSize % 2 == 1) {
            if(!tileChanges.has(getTileID(middleTile, middleTile))) return [false, 'Start from center']; 
        } else {
            if(!tileChanges.has(getTileID(middleTile, middleTile)) && !tileChanges.has(getTileID(middleTile-1, middleTile)) 
                && !tileChanges.has(getTileID(middleTile, middleTile-1)) && !tileChanges.has(getTileID(middleTile-1, middleTile-1))) return [false, 'Start from center'];
        }
    }
    
    const [score, wordsUsedForScoring] = getScore(words, tileData, tileChanges, lobbyData);
    return [isCurrentRound(lobbyData, username), [], score, wordsUsedForScoring];
}   

export function getOrdinal(n: number) {
    const suffixes = ["th", "st", "nd", "rd"];
    const value = Math.abs(n);

    if(value % 100 >= 11 && value % 100 <= 13) {
        return `${n}th`;
    }

    const lastDigit = value % 10;
    const suffix = suffixes[lastDigit] || suffixes[0];

    return `${n}${suffix}`;
}
