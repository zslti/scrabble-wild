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

function isConnected(tileData: TileData[][], row: number, column: number){
    if(row > 0 && tileData[row-1][column].letter != '' && tileData[row-1][column].letter != null) return true;
    if(row < tileData.length-1 && tileData[row+1][column].letter != '' && tileData[row+1][column].letter != null) return true;
    if(column > 0 && tileData[row][column-1].letter != '' && tileData[row][column-1].letter != null) return true;
    if(column < tileData[row].length-1 && tileData[row][column+1].letter != '' && tileData[row][column+1].letter != null) return true;
    return false;
}

function isConnectedToFinalizedTile(tileData: TileData[][], row: number, column: number, tileChanges: Map<string, TileData>, direction?: 'horizontal' | 'vertical'){
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

export function isCurrentRound(lobbyData: Lobby, username: string) {
    return lobbyData.players[lobbyData.round % lobbyData.players.length] == username;
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
            if(!connectedToPreviousWord && tileChanges.has(getTileID(row, column)) && tileData[row][column].letter != '' && tileData[row][column].letter != null && isConnectedToFinalizedTile(tileData, row, column, tileChanges)) {
                connectedToPreviousWord = true;
            }
        }
    }
    if(lobbyData.round == 0) connectedToPreviousWord = true;
    if(!connectedToPreviousWord) return [false, 'Invalid placement'];
    // check if the tiles are all in the same row or column
    let rows = new Set<number>();
    let columns = new Set<number>();
    tileChanges.forEach((tile) => {
        rows.add(tile.row);
        columns.add(tile.column);
    });
    if(rows.size > 1 && columns.size > 1) return [false, 'Invalid placement'];
    // get the word
    let mainWord = '';
    let otherWords = [] as string[];
    let points = 0;
    let wordMultiplier = 1;
    let tilesUsedForScoring = [] as string[];
    if(rows.size === 1) {
        let row = rows.values().next().value;
        let initialStartColumn, initialEndColumn;
        let startColumn = initialStartColumn = Math.min(...Array.from(columns));
        while(startColumn > 0 && tileData[row][startColumn-1].letter != '' && tileData[row][startColumn-1].letter != null) startColumn--;
        let endColumn = initialEndColumn = Math.max(...Array.from(columns));
        while(endColumn < tileData[row].length-1 && tileData[row][endColumn+1].letter != '' && tileData[row][endColumn+1].letter != null) endColumn++;
        for(let column = startColumn; column <= endColumn; column++) {
            if(!tilesUsedForScoring.includes(getTileID(row, column))){
                mainWord += tileData[row][column].letter;
                points += getLetterMultiplier(tileData[row][column]) * getLetterScore(tileData[row][column].letter ?? '', lobbyData.settings.language as keyof typeof languages);
                wordMultiplier *= getWordMultiplier(tileData[row][column]);
                tilesUsedForScoring.push(getTileID(row, column));
            }
        }
        for(let column = initialStartColumn; column <= initialEndColumn; column++) {
            if(isConnectedToFinalizedTile(tileData, row, column, tileChanges, 'horizontal')) {
                let startRow = row;
                while(startRow > 0 && tileData[startRow-1][column].letter != '' && tileData[startRow-1][column].letter != null) startRow--;
                let endRow = row;
                while(endRow < tileData.length-1 && tileData[endRow+1][column].letter != '' && tileData[endRow+1][column].letter != null) endRow++;
                let word = '';
                let p = 0;
                let m = 1;
                for(let r = startRow; r <= endRow; r++) {
                    if(!tilesUsedForScoring.includes(getTileID(row, column))){
                        word += tileData[r][column].letter;
                        p += getLetterMultiplier(tileData[r][column]) * getLetterScore(tileData[r][column].letter ?? '', lobbyData.settings.language as keyof typeof languages);
                        m *= getWordMultiplier(tileData[r][column]);
                        tilesUsedForScoring.push(getTileID(row, column));
                    }
                }
                if(word != mainWord) {
                    points += p;
                    wordMultiplier *= m;
                    otherWords.push(word);
                }
            }
        }
    } 
    if(columns.size === 1 && mainWord.length <= 1) {
        if(mainWord.length <= 1) mainWord = '';
        let column = columns.values().next().value;
        let initialStartRow, initialEndRow;
        let startRow = initialStartRow = Math.min(...Array.from(rows));
        while(startRow > 0 && tileData[startRow-1][column].letter != '' && tileData[startRow-1][column].letter != null) startRow--;
        let endRow = initialEndRow = Math.max(...Array.from(rows));
        while(endRow < tileData.length-1 && tileData[endRow+1][column].letter != '' && tileData[endRow+1][column].letter != null) endRow++;
        for(let row = startRow; row <= endRow; row++) {
            if(!tilesUsedForScoring.includes(getTileID(row, column))){
                mainWord += tileData[row][column].letter;
                points += getLetterMultiplier(tileData[row][column]) * getLetterScore(tileData[row][column].letter ?? '', lobbyData.settings.language as keyof typeof languages);
                wordMultiplier *= getWordMultiplier(tileData[row][column]);
                tilesUsedForScoring.push(getTileID(row, column));
            }
        }
        for(let row = initialStartRow; row <= initialEndRow; row++) {
            if(isConnectedToFinalizedTile(tileData, row, column, tileChanges, 'vertical')) {
                let startColumn = column;
                while(startColumn > 0 && tileData[row][startColumn-1].letter != '' && tileData[row][startColumn-1].letter != null) startColumn--;
                let endColumn = column;
                while(endColumn < tileData[row].length-1 && tileData[row][endColumn+1].letter != '' && tileData[row][endColumn+1].letter != null) endColumn++;
                let word = '';
                let p = 0;
                let m = 1;
                for(let c = startColumn; c <= endColumn; c++) {
                    if(!tilesUsedForScoring.includes(getTileID(row, column))){
                        word += tileData[row][c].letter;
                        p += getLetterMultiplier(tileData[row][c]) * getLetterScore(tileData[row][c].letter ?? '', lobbyData.settings.language as keyof typeof languages);
                        m *= getWordMultiplier(tileData[row][c]);
                        tilesUsedForScoring.push(getTileID(row, column));
                    }
                }
                if(word != mainWord) {
                    points += p;
                    wordMultiplier *= m;
                    otherWords.push(word);
                }
            }
        }
    }
    // check if the word is valid
    if(!isValidWord(mainWord, lobbyData.settings.language as keyof typeof languages)) return [false, 'Invalid word'];
    // check if all the other words are valid
    otherWords.forEach((word) => {
        if(!isValidWord(word, lobbyData.settings.language as keyof typeof languages)) return [false, 'Invalid word'];
    });
    if(!otherWords.includes(mainWord)){
        otherWords.push(mainWord);
    }
    if(lobbyData.round == 0){
        let middleTile: number = Math.floor(tileData.length / 2);
        if(lobbyData.settings.boardSize % 2 == 1){
            if(!tileChanges.has(getTileID(middleTile, middleTile))) return [false, 'Start from center']; 
        } else {
            if(!tileChanges.has(getTileID(middleTile, middleTile)) && !tileChanges.has(getTileID(middleTile-1, middleTile)) && !tileChanges.has(getTileID(middleTile, middleTile-1)) && !tileChanges.has(getTileID(middleTile-1, middleTile-1))) return [false, 'Start from center'];
        }
    }
    // check if the its the players turn
    if(!isCurrentRound(lobbyData, username)) return [false, otherWords, points * wordMultiplier];
    return [true, otherWords, points * wordMultiplier];
}