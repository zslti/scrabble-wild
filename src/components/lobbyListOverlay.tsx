import React from "react";
import ReactDOM from "react-dom";
import { firestore, getLobbies, getLobbyID, getNonStartedLobbies, Lobby } from "../util/firebase";
import isEqual from "lodash.isequal";
import { createOverlay } from "./lobbyOverlay";
import { collection, onSnapshot } from "firebase/firestore";

let lobbyList: Lobby[] = [];

function LobbyListItem(lobby: any) {
    let lobbyData: Lobby = lobby.lobby;
    return (
        <div className="lobby-list-item" onClick={
            () => {
                createOverlay({title: `Join ${lobbyData.name}`, requiresLobbyName: false, requiresPassword: !lobbyData.isPublic, isCreatingLobby: false, proceedText: 'Join', lobby: lobbyData, isProceedButtonLoadingOnClick: true});
            }
        }>
            {!lobbyData.isPublic && <i className="fa-solid fa-lock lobby-list-item-icon"></i>}
            {lobbyData.isPublic && <i className="fa-solid fa-lock-open lobby-list-item-icon"></i>}
            <span className="lobby-list-item-text middle">{lobbyData.name}</span>
            <span className="lobby-list-item-text short"><i className="fa-solid fa-user lobby-list-item-icon small"></i>{lobbyData.players.length}</span>
        </div>
    )
}

export async function createLobbyListOverlay() {
    lobbyList = await getNonStartedLobbies();

    const overlay = React.createElement(LobbyListOverlay);
    ReactDOM.render(overlay, document.getElementById('lobby-overlay-placeholder'));

    setTimeout(() => {
      const overlay = document.querySelector('.lobby-overlay');
      if(overlay) {
        overlay.classList.add('active')
      }
    }, 10);
}

const LobbyListOverlay:React.FC = () => {
    const [localLobbyList, setLocalLobbyList] = React.useState<Lobby[]>([]);

    React.useEffect(() => {
        const overlay = document.querySelector('.lobby-overlay') as HTMLElement;
        setLocalLobbyList(lobbyList);
        updateLobbyList();
    });

    function updateLobbyList() {
        onSnapshot(collection(firestore, "lobbies"), (async (snapshot) => {
            lobbyList = await getNonStartedLobbies();
            if(!isEqual(lobbyList, localLobbyList))
                setLocalLobbyList(lobbyList);
        }));
    }

    return (
        <div className="lobby-overlay" onClick={(e)=>{
            const target = e.target as HTMLElement;
            if(target.classList.contains('lobby-overlay')) {
                target.classList.remove('active');
            }
        }}>
            <div className='overlay-panel lobby'>
                <div className='overlay-title'>Lobbies</div>
                {localLobbyList.length !== 0 && <div className="overlay-subtext" style={{marginBottom: '1rem', marginTop: '-.25rem'}}>Click on a lobby to join</div>}
                {localLobbyList.length === 0 && <div className='overlay-center-text'>No lobbies found</div>}
                <div className="lobby-list">
                    {localLobbyList.map((lobby) => {
                        return <LobbyListItem lobby={lobby} key={crypto.randomUUID()}/>;
                    })}
                </div>
            </div>
        </div>
    )
}