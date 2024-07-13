import { Tooltip } from 'react-tooltip';
import { createOverlay } from './lobbyOverlay';
import { kickPlayer } from '../util/firebase';

interface Props {
    name: string,
    className?: string,
    isAdmin?: boolean,
    isKickable?: boolean,
    playerRole?: string,
    isInactive?: boolean,
    isReady?: boolean,
}

export function getLongestPlayerNameLength(players: string[]) {
    if(!players || players.length == 0) return 0;
    let longestName = 0;
    players.forEach(player => {
        if(player.length > longestName) {
            longestName = player.length;
        }
    });
    return longestName;
}

export function getPlayerNameWidth(players: string[]) {
    return Math.max(4, getLongestPlayerNameLength(players)) * .75
}

function Player(props: Props) {
    function kickFunction() {
        const [lobbyID, name] = localStorage.getItem('currentLobby')?.split(" ") as [string, string];
        kickPlayer(lobbyID, props.name, `You have been kicked by ${name}.`);
    }

    return (
        <div className={"player " + (props.isAdmin?"white ":"") + props.className}>
            <Tooltip anchorSelect=".admin-anchor-element" place="top" className='tooltip'>Admin</Tooltip>
            <Tooltip anchorSelect=".developer-anchor-element" place="top" className='tooltip'>Developer</Tooltip>
            <Tooltip anchorSelect=".inactive-anchor-element" place="top" className='tooltip'>Inactive</Tooltip>            
            <Tooltip anchorSelect=".kick-anchor-element" place="top" className='tooltip'>Kick player</Tooltip>  
            <Tooltip anchorSelect=".ready-anchor-element" place="top" className='tooltip'>Ready</Tooltip>  
            
            {props.isAdmin && <a className="admin-anchor-element"><i className="fa-solid fa-crown"></i></a>}
            {props.playerRole == "developer" && <a className="developer-anchor-element"><i className="fa-solid fa-code"></i></a>}
            {props.isInactive && <a className="inactive-anchor-element"><i className="fa-solid fa-wifi negative flashing"></i></a>}
            {props.isKickable && <a 
                className="kick-anchor-element" 
                onClick={(e) => createOverlay({
                    title: `Kick ${props.name}`, 
                    requiresLobbyName: false, 
                    requiresPassword: false, 
                    isCreatingLobby: false, 
                    isNonCancellable: false, 
                    isConfirmMessage: true, 
                    message: `Are you sure you want to kick ${props.name}?`, 
                    cancelText: 'Cancel', 
                    customProceedIcon: "fa-solid fa-ban", 
                    proceedText: "Kick", 
                    customProceedFunction: kickFunction
                })}>
                <i className="fa-solid fa-ban negative right clickable"></i>
            </a>}
            {props.name}
            {props.isReady && <a className="ready-anchor-element"><i className="fa-solid fa-check" style={{marginLeft: ".3rem"}}></i></a>}
        </div>
    )
}

export default Player