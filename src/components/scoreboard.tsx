import React from 'react'
import { Lobby } from '../util/firebase';
import { getOrdinal } from '../util/scoring';
import Player, { getPlayerNameWidth } from './player';
import FadeOnUpdate from './fadeOnUpdate';
import { lastRoundChange } from '../pages/lobby';
import { getTimeSync } from '../util/time';

interface Props {
    className?: string,
    lobbyData: Lobby,
    username: string,
}

function Scoreboard(props: Props) {
    function getPlayerPosition(player: string) {
        let players = props.lobbyData.playerData;
        let playerList = Object.keys(players);
        playerList.sort((a, b) => (a < b) ? -1 : 1);
        for(let i = 0; i < playerList.length; i++) {
            if(players[playerList[i]].points == undefined || players[playerList[i]].points == null) players[playerList[i]].points = 0;       
        } 
        playerList.sort((a, b) => (players[b].points - players[a].points < 0 || (players[b].points - players[a].points == 0 && a < b)) ? -1 : 1);
        return playerList.indexOf(player) + 1;
    }
    
    let p: Props = props;
    React.useEffect(() => {
        p = props;
    }, [props.lobbyData]);
        

    return (
        <div className={"scoreboard " + p.className}>
            {p.lobbyData.players && p.lobbyData.players.map((player, index) => {
                return (
                    <div key={index} className={"scoreboard-player " + (player == p.username?'current-player':'')} style={{top: `${(getPlayerPosition(player)-1)*2.25+.5}rem`}}>
                        <span style={{width: '3rem', display: 'inline-block'}}>{getOrdinal(getPlayerPosition(player))}</span>
                        <span style={{width: `${getPlayerNameWidth(p.lobbyData.players) + 2}rem`}} className="scoreboard-player-container">
                            <Player 
                                name={player}
                                isAdmin={index == 0}
                                isInactive={p.lobbyData.playerData[player].isInactive}
                                key={player}
                                playerRole={p.lobbyData.playerData[player].role}
                                className='inline'
                            />
                        </span>
                        <FadeOnUpdate
                            childComponent={<span style={{width: '6rem', display: 'inline-block'}}>{p.lobbyData.playerData[player].points ?? 0} points</span>}
                            id={`scoreboard-player-${index}`}
                            className='inline'
                            keyValue={p.lobbyData.playerData[player].points ?? 0}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default Scoreboard;