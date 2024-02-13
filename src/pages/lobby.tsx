import React, { useReducer } from 'react';
import '../style.css';
import useScript from '../util/useScript';
import { Lobby, checkPlayerKicked, finishRound, firestore, getLobby, leaveLobby, setEditedTiles, setLobby, startLobby, toggleReady } from '../util/firebase';
import isEqual from 'lodash.isequal';
import { createOverlay } from '../components/lobbyOverlay';
import Loader from '../components/loader';
import Button, { GameButton } from '../components/button';
import { onSnapshot, collection } from 'firebase/firestore';
import Player from '../components/player';
import { Tooltip } from 'react-tooltip';
import Countdown from '../components/countdown';
import AnimatedAppear from '../components/animatedAppear';
import Input from '../components/input';
import { error } from 'console';
import { type } from 'os';
import { mousePosition } from '../util/mousePosition';
import { fillInBlankLetters, getWordDefinition, isValidWord } from '../util/words';
import { createWordDefinitionOverlay } from '../components/wordDefinition';
import { getLanguageCode, languages } from '../util/languages';
import Logo from '../components/logo';
import Dropdown from '../components/dropdown';
import Draggable from 'react-draggable';
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import Tile, { TileData, getStartingTileMatrix, getTileData, getTileID, isMiddleTile, isTileDroppable } from '../components/tile';
import { getTime, getTimeSync, timeDifference } from '../util/time';
import { getCharArrayFromString, isValidJSON, toFirstLetterUppercase } from '../util/string';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DndDraggable } from '../components/draggable';
import { DndDroppable } from '../components/droppable';
import { isMobile } from '../util/mobile';
import { getLetterScore, isCurrentRound, isFinalizable } from '../util/scoring';

let lobbyData: Lobby = {} as Lobby;
let wasOverlayCreated = false;
let lobbyErrors: string[] = [];
let gameStartedAt = 0;
let lastDragStart = 0;
let lastAlert = getTimeSync();
let selectedTileID: number | null = null;
let currentRound = -1;

function LobbyPage() {
  const [localLobbyData, setlocalLobbyData] = React.useState({} as Lobby);
  const [localTileChanges, setLocalTileChanges] = React.useState(new Map<string, TileData>());
  const [playableTileChanges, setPlayableTileChanges] = React.useState([] as number[]);
  const [_, forceUpdate] = useReducer(x => x + 1, 0);
  const [inviteCopyTime, setInviteCopyTime] = React.useState(0);
  const [boardSize, setBoardSize] = React.useState('15');
  const [roundTime, setRoundTime] = React.useState('60');
  const [language, setLanguage] = React.useState('English');
  const [layout, setLayout] = React.useState('Classic');
  const [multiplier, setMultiplier] = React.useState('1');
  const [dragOverlayData, setDragOverlayData] = React.useState(null as TileData | null);
  const [draggedItemID, setDraggedItemID] = React.useState(null as number | null);
  const localUsername = localStorage.getItem("currentLobby")?.split(" ")[1] ?? '';

  useScript('https://kit.fontawesome.com/069af330f2.js');
  React.useEffect(() => {
    window.scrollTo(0,1);
    const url = window.location.href.split('/');
    const lobbyID = url[url.length - 1];
    const authLobby = (localStorage.getItem('authLobby')?.split(' ')[0]) ?? '';
    updateLobbyData();
    if(authLobby != lobbyID && !wasOverlayCreated && lobbyData?.name != undefined) {
      wasOverlayCreated = true;
      createOverlay({title: `Join ${lobbyData.name}`, requiresLobbyName: false, requiresPassword: !lobbyData.isPublic, isCreatingLobby: false, proceedText: 'Join', lobby: lobbyData, isNonCancellable: true, isProceedButtonLoadingOnClick: true});
    }
    if(lobbyData?.name != undefined){
      const loader = document.querySelector('.lobby-loader');
      if(loader) {
        loader.classList.add('hidden');
      }
    }
    setTimeout(() => {
      if(lobbyData?.name == undefined){
        const loader = document.querySelector('.lobby-loader');
        if(loader) {
          loader.classList.add('hidden');
          const error = document.querySelector('.lobby-error-container');
          if(error) {
            error.classList.add('active');
          }
        }
      }
    }, 5000);
    if(lobbyData?.isStarted){
      const activeLobbyContainer = document.querySelector('.lobby-container.active');
      if(activeLobbyContainer) {
        activeLobbyContainer.classList.remove('active');
        const gameContainer = document.querySelector('.game-container');
        if(gameContainer) {
          gameContainer.classList.add('active');
        }
      }
    }
  });

  function updateLobbyData() {     
      async function onUpdate(){
        const url = window.location.href.split('/');
        lobbyData = await getLobby(url[url.length - 1]) as Lobby;
        if(lobbyData?.name == undefined) return;
        if(!isEqual(lobbyData, localLobbyData)){
          setlocalLobbyData(lobbyData);
          if(lobbyData?.isStarted) {
            gameStartedAt = await getTime();
            const loader = document.querySelector('.lobby-loader');
            if(loader && (localLobbyData.round == -1 || localLobbyData.round == null)) {
              loader.classList.remove('hidden');
              setTimeout(() => {
                loader.classList.add('hidden');
              }, 3000);
            }
          }
          if(lobbyData?.round != null && lobbyData?.round != -1 && lobbyData?.round != currentRound){
            currentRound = lobbyData.round;
            if(isCurrentRound(lobbyData, localUsername)){
              setEditedTiles(localStorage.getItem("currentLobby")?.split(" ")[0] ?? '', localTileChanges);
            }
            const now = await getTime();
            if(lobbyData.alert?.text != null && lastAlert + 2000 < now && lobbyData.alert?.time + 2000 > now){
              lastAlert = now;
              // create alert here
            }
          }
          if(!isCurrentRound(lobbyData, localUsername)){
            lobbyData.editedTiles.forEach((tileID) => {
              if(localTileChanges.has(tileID)){
                const tileData = localTileChanges.get(tileID);
                localTileChanges.delete(tileID);
                for(let i = 0; i < playableTileChanges.length; i++){
                  if(lobbyData?.playerData[localUsername]?.letters[playableTileChanges[i] - 1] == tileData?.letter){
                    playableTileChanges.splice(i, 1);
                    break;
                  }
                }
              }
            });
          }
        }
        const [lobby, name] = localStorage.getItem('currentLobby')?.split(' ') ?? ['',''];
        checkPlayerKicked(lobby, name);
      }
      
      onSnapshot(collection(firestore, "lobbies"), ((snapshot) => {
        onUpdate();
      }));
      onSnapshot(collection(firestore, "kicks"), ((snapshot) => {
        onUpdate();
      }));
  }

  let isLocalUserAdmin = false;
  if(localLobbyData != null && localLobbyData.players != null) {
    const localUsername = localStorage.getItem("currentLobby")?.split(" ")[1] ?? '';
    isLocalUserAdmin = localLobbyData.players?.indexOf(localUsername) == 0;
  }
  
  async function leaveLobbyFunction() {
    const [lobby, name] = localStorage.getItem('currentLobby')?.split(' ') ?? ['',''];
    await leaveLobby(lobby, name);
    localStorage.removeItem('currentLobby');
    localStorage.removeItem('authLobby');
    setTimeout(() => {
      window.location.href = '/scrabblewild';
    }, 500);
  }

  async function proceed(){
    const [lobbyID, name] = localStorage.getItem('currentLobby')?.split(' ') ?? ['',''];
    if(isLocalUserAdmin) {
      if(getLobbyProceedError() == null)
        startLobby(lobbyID);
    } else {
      toggleReady(lobbyID, name);
    }
  }

  let isLocalUserReady = false;
  if(localLobbyData != null && localLobbyData.players != null){
    isLocalUserReady = localLobbyData?.playerData[localUsername]?.isReady;
  }

  function getLobbyProceedError() {
    if(localLobbyData == null || localLobbyData.players == null) return;
    const localUsername = localStorage.getItem("currentLobby")?.split(" ")[1] ?? '';
    if(isLocalUserAdmin){
      if(localLobbyData.players.length < 2) return "You need at least 2 players to start the game";
      if(!localLobbyData.players.every((player, index) => localLobbyData.playerData[player].isReady || index == 0)) return "All players must be ready to start the game";
      if(lobbyErrors.length > 0) return `Invalid ${lobbyErrors.join(', ')}`;
    }else{
      if(localLobbyData?.playerData[localUsername]?.isReady) return "You are currently ready";
      return "You are currently not ready";
    }
    return null;
  }

  function setLobbyData(changed: string, value: any) {
    lobbyData = localLobbyData;
    lobbyData.settings.boardSize = parseInt(boardSize);
    lobbyData.settings.roundTime = parseInt(roundTime);
    lobbyData.settings.multiplier = parseFloat(multiplier);
    if(changed == 'board size') lobbyData.settings.boardSize = value;
    if(changed == 'round time') lobbyData.settings.roundTime = value;
    if(changed == 'language') lobbyData.settings.language = value;
    if(changed == 'layout') lobbyData.settings.layout = value;
    if(changed == 'multiplier') lobbyData.settings.multiplier = value;
    lobbyErrors = [];
    if(changed == 'layout' && lobbyData.settings.layout == 'random'){
      lobbyData.settings.multiplier = 1;
      setMultiplier('1');
    }
    if(lobbyData.settings.boardSize == null || lobbyData.settings.boardSize < 10 || lobbyData.settings.boardSize > 50 || isNaN(lobbyData.settings.boardSize)) {lobbyErrors.push('board size');}
    if(lobbyData.settings.roundTime == null || lobbyData.settings.roundTime < 10 || lobbyData.settings.roundTime > 150 || isNaN(lobbyData.settings.roundTime)) {lobbyErrors.push('round time');}
    if(lobbyData.settings.layout == 'random' && (lobbyData.settings.multiplier == null || lobbyData.settings.multiplier < 0 || lobbyData.settings.multiplier > 10 || isNaN(lobbyData.settings.multiplier))) {lobbyErrors.push('multiplier');}
    if(lobbyErrors.length > 0) return;
    if(lobbyData.settings.boardSize % 2 == 0 && lobbyData.settings.layout == 'classic') lobbyData.settings.boardSize++;
    setBoardSize(lobbyData.settings.boardSize.toString());
    setlocalLobbyData(lobbyData);
    setLobby(localStorage.getItem("currentLobby")?.split(" ")[0] ?? '', lobbyData);
  }

  async function handleDragEnd(e: DragEndEvent){
    setDraggedItemID(null);
    const now = await getTime();
    if(lastDragStart + 300 > now && e.delta.x < 1 && e.delta.y < 1){
      if(selectedTileID != e.active.id)
        selectedTileID = e.active.id as number;
      else
        selectedTileID = null;
      forceUpdate();
      return;
    };
    selectedTileID = null;
    if(e.over == null) return;
    setDragOverlayData(null);

    const target = {
      id: e.over.id as string,
      tileData: getTileData(parseInt(e.over.id.toString().split('-')[0]), parseInt(e.over.id.toString().split('-')[1]), localTileChanges, localLobbyData)
    }
    const source = {
      id: e.active.id as number,
      letter: localLobbyData.playerData[localUsername].letters[e.active.id as number - 1]
    }
    let _localTileChanges = localTileChanges;
    _localTileChanges.set(target.id, {row: target.tileData.row, column: target.tileData.column, letter: source.letter, language: localLobbyData.settings.language as keyof typeof languages, specialTile: target.tileData.specialTile});
    setLocalTileChanges(_localTileChanges);
    let _playableTileChanges = playableTileChanges;
    _playableTileChanges.push(source.id);
    setPlayableTileChanges(_playableTileChanges);
    if(isCurrentRound(localLobbyData, localUsername))
      setEditedTiles(localStorage.getItem("currentLobby")?.split(" ")[0] ?? '', _localTileChanges);
    forceUpdate();
  }

  async function handleDragStart(e: DragStartEvent){
    const letter = localLobbyData.playerData[localUsername].letters[e.active.id as number - 1]
    setDragOverlayData({row: 0, column: 0, letter: letter});
    setDraggedItemID(e.active.id as number);
    const now = await getTime();
    lastDragStart = now;
  }

  function handleTileClick(tile: TileData){
    const id = getTileID(tile.row, tile.column);
    if(selectedTileID != null){
      if(!isTileDroppable(tile)) return;
      const letter = localLobbyData.playerData[localUsername].letters[selectedTileID - 1];
      localTileChanges.set(id, {row: tile.row, column: tile.column, letter: letter, language: localLobbyData.settings.language as keyof typeof languages, specialTile: tile.specialTile});
      playableTileChanges.push(selectedTileID);
      selectedTileID = null;
      if(isCurrentRound(localLobbyData, localUsername))
        setEditedTiles(localStorage.getItem("currentLobby")?.split(" ")[0] ?? '', localTileChanges);
      forceUpdate();
      return;
    }
    if(localTileChanges.has(id)){
      localTileChanges.delete(id);
      for(let i = 0; i < playableTileChanges.length; i++){
        if(localLobbyData.playerData[localUsername].letters[playableTileChanges[i] - 1] == tile.letter){
          playableTileChanges.splice(i, 1);
          break;
        }
      }
      if(isCurrentRound(localLobbyData, localUsername))
        setEditedTiles(localStorage.getItem("currentLobby")?.split(" ")[0] ?? '', localTileChanges);
    }
    forceUpdate();
  }

  let [finalizable, reason, points] = isFinalizable(localLobbyData, localTileChanges, localUsername);
  if(points != null && (points as number) > 0){
    reason = `${points} points`;
  }
  return (
    <>
      <div className='lobby-container active'>
        <div className="title">{localLobbyData?.name}</div>
        <div className="lobby-subtitle"><i className="fa-solid fa-user"></i>Players ({localLobbyData?.players?.length})</div>
        <div className="lobby-players-container">
          {
          localLobbyData?.players?.map((player, index) => {
            const playerData = localLobbyData.playerData[player];
            return (
              <Player 
                name={player} 
                isAdmin={index == 0} 
                playerRole={playerData.role} 
                isInactive={playerData.isInactive}
                isReady={playerData.isReady}
                isKickable={isLocalUserAdmin && index != 0}
                key={player}
              />
            );
          })} 
        </div>
        <div className="lobby-subtitle clickable" id="invite-button" onClick={async (e) => {navigator.clipboard.writeText(window.location.href); setInviteCopyTime(await getTime()); setTimeout(() => {setInviteCopyTime(0)}, 3000)}}><i className="fa-solid fa-plus"></i>Invite more</div>
        <AnimatedAppear isVisible={getTimeSync() - inviteCopyTime < 2000} height='1.2rem' className='invite-tooltip-container' childComponent={<div className={`lobby-text invite-tooltip ${getTimeSync() - inviteCopyTime > 2000?'hidden':''}`}>Invite link copied to clipboard!</div>}/>
        <div className="lobby-right-container">
          <div className="lobby-subtitle"><i className="fa-solid fa-gear"></i>Settings</div>
          <div className="lobby-settings-scroll-helper">
            <div className="lobby-settings-container">
              <div className='lobby-settings-item' style={{height: `${isLocalUserAdmin?(((lobbyErrors.includes('board size')) ?? false)?'5.7rem':'4.3rem'):'3.5rem'}`}}>
                <div className="lobby-text white large-margin">Board size</div>
                {isLocalUserAdmin && <Input value={boardSize} onChange={(value) => {setBoardSize(value); localLobbyData.settings.boardSize = parseInt(value); setLobbyData('board size', parseInt(value))}} placeholder='Size' icon='fa-solid fa-ruler' isSmall={true} className='settings-input'/>}
                {isLocalUserAdmin && <AnimatedAppear isVisible={(lobbyErrors.includes('board size')) ?? false} height='1.5rem' childComponent={<div className="overlay-subtext small-margin error">{`Invalid board size`}</div>}/>}
                {!isLocalUserAdmin && <div className="lobby-text"><i className="fa-solid fa-ruler"></i>{localLobbyData?.settings?.boardSize}</div>}
              </div>
              <div className='lobby-settings-item' style={{height: `${isLocalUserAdmin?(((lobbyErrors.includes('round time')) ?? false)?'5.7rem':'4.3rem'):'3.5rem'}`}}>
                <div className="lobby-text white large-margin">Round time (seconds)</div>
                {isLocalUserAdmin && <Input value={roundTime} onChange={(value) => {setRoundTime(value); localLobbyData.settings.roundTime = parseInt(value); setLobbyData('round time', parseInt(value))}} placeholder='Time' icon='fa-solid fa-clock' isSmall={true} className='settings-input'/>}
                {isLocalUserAdmin && <AnimatedAppear isVisible={(lobbyErrors.includes('round time')) ?? false} height='1.5rem' childComponent={<div className="overlay-subtext small-margin error">{`Invalid round time`}</div>}/>}
                {!isLocalUserAdmin && <div className="lobby-text"><i className="fa-solid fa-clock"></i>{localLobbyData?.settings?.roundTime}</div>}
              </div>
              <div className='lobby-settings-item'>
                <div className="lobby-text white large-margin">Language</div>
                {isLocalUserAdmin && <Dropdown icon='fa-solid fa-language' excludeCurrentSelection={true} value={language} options={['English', 'Hungarian']} onChange={(e) => {setLanguage(e); localLobbyData.settings.language = getLanguageCode(e) ?? 'en'; setLobbyData('language', getLanguageCode(e) ?? 'en')}}/>}
                {!isLocalUserAdmin && <div className="lobby-text"><i className="fa-solid fa-language"></i>{languages[localLobbyData?.settings?.language as keyof typeof languages]}</div>}
              </div>
              <div className='lobby-settings-item'>
                <div className="lobby-text white large-margin">Tile layout</div>
                {isLocalUserAdmin && <Dropdown icon='fa-solid fa-grip' excludeCurrentSelection={true} value={layout} options={['Classic', 'Random']} onChange={(e: string) => {setLayout(e); localLobbyData.settings.layout = e.toLowerCase(); setLobbyData('layout', e.toLowerCase())}}/>}
                {!isLocalUserAdmin && <div className="lobby-text"><i className="fa-solid fa-grip"></i>{toFirstLetterUppercase(localLobbyData?.settings?.layout ?? '')}</div>}
              </div>
              <div className='lobby-settings-item' style={{height: `${isLocalUserAdmin?(((lobbyErrors.includes('multiplier')) ?? false)?'5.7rem':'4.3rem'):'3.5rem'}`}}>
                <AnimatedAppear isVisible={lobbyData?.settings?.layout == 'random'} height='1.9rem' childComponent={<div className="lobby-text white large-margin">Special tiles multiplier</div>}/>
                {isLocalUserAdmin && <AnimatedAppear isVisible={lobbyData?.settings?.layout == 'random'} height='2.65rem' childComponent={<Input value={multiplier} onChange={(value) => {setMultiplier(value); localLobbyData.settings.multiplier = parseFloat(value); setLobbyData('multiplier', parseFloat(value))}} placeholder='Mul' icon='fa-solid fa-xmark' isSmall={true} className='settings-input'/>}/>}
                {isLocalUserAdmin && <AnimatedAppear isVisible={(lobbyErrors.includes('multiplier')) ?? false} height='1.5rem' childComponent={<div className="overlay-subtext small-margin error">{`Invalid multiplier`}</div>}/>}
                {!isLocalUserAdmin && <AnimatedAppear isVisible={lobbyData?.settings?.layout == 'random'} height={'1.6rem'} childComponent={<div className="lobby-text"><i className="fa-solid fa-xmark"></i>{localLobbyData?.settings?.multiplier}</div>}/>}
              </div>
            </div>
          </div>
        </div>
        <div className="lobby-button-container">
          {getLobbyProceedError() != null && <Tooltip anchorSelect=".button-anchor-element" place="top" className='tooltip'>{getLobbyProceedError()}</Tooltip>}
          <Button text="Leave lobby" icon="fa-solid fa-arrow-right-from-bracket" className='negative' onClick={() => {createOverlay({title: `Leave lobby`, requiresLobbyName: false, requiresPassword: false, isCreatingLobby: false, isNonCancellable: false, isConfirmMessage: true, message: `Are you sure you want to leave this lobby?`, cancelText: 'Cancel', customProceedIcon: "fa-solid fa-arrow-right-from-bracket", proceedText: "Leave", customProceedFunction: leaveLobbyFunction})}}/>
          <Button text={isLocalUserAdmin?"Start lobby":(isLocalUserReady?"Unready":"Ready")} icon={`fa-solid fa-${isLocalUserAdmin?'play':'check'}`} onClick={proceed} isInactive={isLocalUserAdmin && getLobbyProceedError() != null} className='button-anchor-element' isLoadingOnClick={isLocalUserAdmin && getLobbyProceedError() == null}/>
        </div>
      </div>
      <DndContext onDragStart={(e) => {handleDragStart(e)}} onDragEnd={(e) => {handleDragEnd(e)}} sensors={useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(PointerSensor))}>
        <div className="game-container">
          <Draggable cancel='.clickable' bounds={{left: 0, top: -700, right: 1500, bottom: 600}}>
            <div className="game-draggable-container">
              {isValidJSON(localLobbyData.tiles || JSON.stringify(getStartingTileMatrix(0, "default", 1))) && (JSON.parse(localLobbyData.tiles || JSON.stringify(getStartingTileMatrix(0, "default", 1))) as TileData[][])?.map((tiles, row) => {
                return(tiles.map((tile, column) => {
                  const _tileData = getTileData(row, column, localTileChanges, localLobbyData);
                  const tileID = getTileID(row, column);
                  const isEditedTile = localLobbyData.editedTiles.includes(tileID) && !isCurrentRound(localLobbyData, localUsername);
                  return <div className={(_tileData.letter != null || selectedTileID != null) ? `clickable` : undefined} onClick={(e) => {handleTileClick(_tileData)}}>
                    <DndDroppable type='tile' id={tileID} disabled={!isTileDroppable(_tileData) || isEditedTile}>
                      <Tile isEditedTile={isEditedTile} isMiddleTile={isMiddleTile(row, column, localLobbyData.settings.boardSize)} data={{row: row, column: column, letter: _tileData.letter, language: _tileData.language, specialTile: _tileData.specialTile, isFinalized: localTileChanges.has(tileID)?false:_tileData.isFinalized}}/>
                    </DndDroppable>
                  </div>
                }))
              })}
            </div>
          </Draggable>
          {localLobbyData.round == -1 && <div className="game-start-countdown" style={{position: 'absolute', top: '0'}}>
            <div className="game-start-countdown-text">Game starting in</div>
            <Countdown onTimerEnd={() => {if(isLocalUserAdmin) finishRound(localStorage.getItem('currentLobby')?.split(' ')[0] ?? '', localTileChanges, localUsername, 0)}} countingTo={gameStartedAt + 10000} digits={1} className='game-start'/>
          </div>}
          {localLobbyData.playerData && localUsername && localLobbyData.playerData[localUsername]?.letters && <div className="playable-letters-bar" style={{width: `${(isMobile() && window.innerHeight > window.innerWidth ? 3.25 : 3.5)*(localLobbyData.playerData[localUsername]?.letters.length - playableTileChanges.length) + .25}rem`}}>
            {getCharArrayFromString(localLobbyData.playerData[localUsername]?.letters ?? '').map((letter, index) => {
              return (
                <DndDraggable id={index+1}>
                  <Tile className={selectedTileID == index + 1 ? 'selected' : undefined} isDragged={draggedItemID == index + 1} isPlayable={true} isRemovedFromBar={playableTileChanges.includes(index+1)} data={{row: index, column: 0, letter: letter, language: (lobbyData.settings?.language ?? 'en') as keyof typeof languages}}/>
                </DndDraggable>
              )
            })}
          </div>}
          <GameButton onClick={() => {if(finalizable) {finishRound(localStorage.getItem('currentLobby')?.split(' ')[0] ?? '', localTileChanges, localUsername, points as number); setTimeout(() => {setLocalTileChanges(new Map<string, TileData>()); setPlayableTileChanges([])}, 500);}}} text='Play' text2={reason?.toString()} isInactive={!finalizable}/>
          {dragOverlayData != null && <DragOverlay>
            <div id={getTileID(dragOverlayData.row, dragOverlayData.column)} style={{margin: '0'}}>
              <div className="tile overlay-item">
                <div className="tile-letter">{dragOverlayData.letter}</div>
                <div className="tile-value">{getLetterScore(dragOverlayData.letter ?? '', (lobbyData.settings?.language ?? 'en') as keyof typeof languages)}</div>
              </div>
            </div>
          </DragOverlay>}
        </div>
      </DndContext>
      <div id="overlay-placeholder"></div>
      <div id="definiton-overlay-placeholder"></div>
      <Loader className="lobby-loader"/>
      <div className="lobby-error-container">
        <div className="lobby-error">We couldn't find this lobby...<br/>Looks like your invite link is invalid.</div>
        <div className="lobby-error-button-container">
          <Button text='Back to home' className='fixed-size-button negative light' icon='fa-solid fa-arrow-left' onClick={() => {window.location.href = '/scrabblewild'}}/>
          <Button text='Try again' className='fixed-size-button' icon='fa-solid fa-rotate-left' onClick={() => {window.location.reload()}}/>
        </div>
      </div>
    </>
  );
}

export default LobbyPage;