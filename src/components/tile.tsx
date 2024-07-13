import { CSSProperties } from 'react'
import { getLetterScore, letterScores } from '../util/scoring'
import { languages } from '../util/languages'
import { Lobby } from '../util/firebase';

export interface TileData {
    row: number,
    column: number,
    letter?: string,
    language?: keyof typeof languages,
    specialTile?: string | null,
    isFinalized?: boolean,
}

export function getStartingTileMatrix(size: number, layout: string, multiplier: number) {
    if(layout == 'random') return getRandomTileLayout(size, multiplier);
    return getDefaultTileLayout(size);
}

function getDefaultTileLayout(size: number) {
    let matrix: TileData[][] = [];
    for(let row = 0; row < size; row++) {
        matrix.push([])
        for(let column = 0; column < size; column++) {
            let specialTile: string | null = null;
            if(row == 0 && column == 0) specialTile = '3w';
            else if(row == 0 && column == size - 1) specialTile = '3w';
            else if(row == size - 1 && column == 0) specialTile = '3w';
            else if(row == size - 1 && column == size - 1) specialTile = '3w';
            else if(row == 0 && column == Math.floor(size / 2)) specialTile = '3w';
            else if(row == Math.floor(size / 2) && column == 0) specialTile = '3w';
            else if(row == size - 1 && column == Math.floor(size / 2)) specialTile = '3w';
            else if(row == Math.floor(size / 2) && column == size - 1) specialTile = '3w';
            else if(row == Math.floor(size / 2) - 1 && column == Math.floor(size / 2) - 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 1 && column == Math.floor(size / 2) + 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 1 && column == Math.floor(size / 2) - 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 1 && column == Math.floor(size / 2) + 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 5 && column == Math.floor(size / 2) - 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 1 && column == Math.floor(size / 2) - 5) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 5 && column == Math.floor(size / 2) + 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 1 && column == Math.floor(size / 2) + 5) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 5 && column == Math.floor(size / 2) - 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 1 && column == Math.floor(size / 2) - 5) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 5 && column == Math.floor(size / 2) + 1) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 1 && column == Math.floor(size / 2) + 5) specialTile = '2l';
            else if(row == Math.floor(size / 2) - 6 && column == Math.floor(size / 2) - 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 2 && column == Math.floor(size / 2) - 6) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 6 && column == Math.floor(size / 2) + 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 2 && column == Math.floor(size / 2) + 6) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 6 && column == Math.floor(size / 2) - 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 2 && column == Math.floor(size / 2) - 6) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 6 && column == Math.floor(size / 2) + 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 2 && column == Math.floor(size / 2) + 6) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 2 && column == Math.floor(size / 2) - 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 2 && column == Math.floor(size / 2) + 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 2 && column == Math.floor(size / 2) - 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) + 2 && column == Math.floor(size / 2) + 2) specialTile = '3l';
            else if(row == Math.floor(size / 2) - 4 && column == Math.floor(size / 2)) specialTile = '2l';
            else if(row == Math.floor(size / 2) && column == Math.floor(size / 2) - 4) specialTile = '2l';
            else if(row == Math.floor(size / 2) && column == Math.floor(size / 2) + 4) specialTile = '2l';
            else if(row == Math.floor(size / 2) + 4 && column == Math.floor(size / 2)) specialTile = '2l';
            else if(row == column) specialTile = '2w';
            else if(row == size - column - 1) specialTile = '2w';
            else if(row == 0 && column == Math.floor(size / 4)) specialTile = '2l';
            else if(row == size - 1 && column == Math.floor(size / 4)) specialTile = '2l';
            else if(column == 0 && row == Math.floor(size / 4)) specialTile = '2l';
            else if(column == size - 1 && row == Math.floor(size / 4)) specialTile = '2l';
            else if(row == 0 && column == size - Math.floor(size / 4) - 1) specialTile = '2l';
            else if(row == size - 1 && column == size - Math.floor(size / 4) - 1) specialTile = '2l';
            else if(column == 0 && row == size - Math.floor(size / 4) - 1) specialTile = '2l';
            else if(column == size - 1 && row == size - Math.floor(size / 4) - 1) specialTile = '2l';
            if(specialTile != null) matrix[row].push({row, column, specialTile: specialTile})
            else matrix[row].push({row, column})
        }
    }
    return matrix;
}

const randomTileMultipliers = {
    '2l': 24,
    '3l': 12,
    '2w': 17,
    '3w': 8,
}

function getRandomTileLayout(size: number, multiplier: number) {
    let matrix: TileData[][] = [];

    for(let row = 0; row < size; row++) {
        matrix.push([])
        for(let column = 0; column < size; column++) {
            matrix[row].push({row, column})
        }
    }
    let tileMultipliers = Object.assign({}, randomTileMultipliers);
    const sizeMultiplier = size * size / 225;
    Object.keys(tileMultipliers).forEach(key => {
        const k = key as keyof typeof tileMultipliers;
        tileMultipliers[k] = Math.floor(tileMultipliers[k] * multiplier * sizeMultiplier);
        for(let i = 0; i < tileMultipliers[k]; i++) {
            let row = Math.floor(Math.random() * size);
            let column = Math.floor(Math.random() * size);
            let retryCount = 0;
            while(matrix[row][column].specialTile) {
                row = Math.floor(Math.random() * size);
                column = Math.floor(Math.random() * size);
                retryCount++;
                if(retryCount > 1000) break;
            }
            matrix[row][column].specialTile = key;
        }
    });
    return matrix;
}

interface Props {
    className?: string,
    isPlayable?: boolean,
    isRemovedFromBar?: boolean,
    isBoardTile?: boolean,
    isDragged?: boolean,
    isMiddleTile?: boolean,
    isEditedTile?: boolean,
    data: TileData,
}

export function getTileData(row: number, column: number, localTileChanges: Map<string, TileData>, lobbyData: Lobby) {
    const id = getTileID(row, column);
    if(localTileChanges.has(id)) return localTileChanges.get(id) as TileData;
    return JSON.parse(lobbyData.tiles)[row][column] as TileData;
}

export function getTileID(row: number, column: number) {
    return `${row}-${column}`;
}

export function isTileDroppable(tile: TileData) {
    return tile.letter == null;
}

export function isMiddleTile(row: number, column: number, size: number) { 
    let middle: number = Math.floor(size / 2);
    if(size % 2 == 1) {
        if(row == middle && column == middle) return true; 
    } else {
        if(row == middle && column == middle) return true;
        if(row == middle - 1 && column == middle) return true;
        if(row == middle && column == middle - 1) return true;
        if(row == middle - 1 && column == middle - 1) return true;
    }
    return false;
}

export function getLetterMultiplier(tile: TileData) {
    if(tile.specialTile == '2l') return 2;
    if(tile.specialTile == '3l') return 3;
    return 1;
}

export function getWordMultiplier(tile: TileData) {
    if(tile.specialTile == '2w') return 2;
    if(tile.specialTile == '3w') return 3;
    return 1;
}

function Tile(props: Props) {
    function getTileColor():string{
        if(props.data.isFinalized) {
            if(props.data.specialTile == '2l')
                return '#e600ff';
            if(props.data.specialTile == '3l')
                return '#7700ff';
            if(props.data.specialTile == '2w')
                return '#8f57ff';
            if(props.data.specialTile == '3w')
                return '#ff5795';
            return '#b700ff';
        }
        if(props.data.letter)
            return '#9500ff';
        if(props.isEditedTile)
            return '#7700ff';
        if(props.isMiddleTile)
            return '#0aa2cc';
        if(props.data.specialTile == '2l')
            return '#4d8bff';
        if(props.data.specialTile == '3l')
            return '#004ad4';
        if(props.data.specialTile == '2w')
            return '#004ad4';
        if(props.data.specialTile == '3w')
            return '#d91d00';
        return '#282b31a8';
    }

    function getTileStyle():CSSProperties{
        if(props.isDragged) return {top: '0', opacity: '0', position: 'relative', background: `${getTileColor()}`, transition: 'width .4s, margin .4s, transform .2s'};
        if(props.isRemovedFromBar) return {top: '0', position: 'relative', opacity: '0', width: '0', margin: '0', transition: 'width .4s, margin .4s, transform .2s'};
        if(props.isPlayable) return {top: '0', position: 'relative', background: `${getTileColor()}`, transition: 'width .4s, margin .4s, opacity .2s .1s, transform .2s'};
        return {left: `${props.data.row * 0}rem`, top: `${props.data.column * 0}rem`, background: `${getTileColor()}`, transition: 'background .2s, transform .2s'}
    }

    const letterMultiplier = getLetterMultiplier(props.data);
    return (
        <div id={props.isBoardTile?getTileID(props.data.row, props.data.column):undefined} className={"tile " + props.className} style={getTileStyle()}>
            <>
                {props.data.letter && props.data.language && <>
                    <div className="tile-letter">{props.data.letter}</div>
                    <div className={`tile-value ${letterMultiplier == 3?'triple':(letterMultiplier == 2?'double':'')}`}>
                        {letterMultiplier * getLetterScore(props.data.letter, props.data.language)}
                    </div>
                </>}
                {!props.data.letter && props.data.specialTile && !props.isEditedTile && <div className="tile-double-letter">{props.data.specialTile}</div>}
            </>
        </div>
    )
}

export default Tile