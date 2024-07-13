import React from 'react'
import ReactDOM from 'react-dom';
import Input from './input';
import Switch from './switch';
import AnimatedAppear from './animatedAppear';
import Button from './button';
import { Lobby, createLobby, getLobby, getLobbyID, getPlayerRole, joinLobby } from '../util/firebase';
import { getTime } from '../util/time';

let wasOverlayDestroyed = false;

interface Props {
    requiresPassword?: boolean,
    requiresLobbyName?: boolean,
    isCreatingLobby?: boolean,
    title?: string,
    proceedText?: string,
    cancelText?: string,
    className?: string,
    lobby?: Lobby,
    isNonCancellable?: boolean,
    isMessage?: boolean,
    message?: string,
    isConfirmMessage?: boolean,
    customProceedIcon?: string,
    isProceedButtonLoadingOnClick?: boolean,
    customProceedFunction?: () => void,
}

interface Error {
    message: string;
    visible: boolean;
}

export function createOverlay(props: Props) {
    const overlay = React.createElement(LobbyOverlay, {...props});
    ReactDOM.render(overlay, document.getElementById('overlay-placeholder'));
    setTimeout(() => {
      const overlay = document.querySelector('.overlay');
      overlay?.classList.add('active');
    }, 10);
}

export function removeOverlay() {
    const overlay = document.querySelector('.overlay');
    overlay?.classList.remove('active')
    wasOverlayDestroyed = true;
}

function LobbyOverlay(props: Props) {
    const [name, setName] = React.useState('');
    const [lobbyName, setLobbyName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isPublic, setIsPublic] = React.useState(true);
    const [errors, setErrors] = React.useState(new Map<string, Error>());

    function setNickname(name: string) {
        localStorage.setItem('name', name);
        setName(name);
    }

    async function onProceed() {
        if(props.customProceedFunction) {
            props.customProceedFunction();
            removeOverlay();
            return false;
        }
        if(props.isCreatingLobby) {
            if(!lobbyName || lobbyName.length === 0) 
                setErrors(new Map<string, Error>(errors.set('lobbyName', {message: 'Lobby name cannot be empty', visible: true})));
            if(!isPublic && (!password || password.length === 0))
                setErrors(new Map<string, Error>(errors.set('password', {message: 'Password cannot be empty', visible: true})));
            if(!name || name.length === 0) 
                setErrors(new Map<string, Error>(errors.set('name', {message: 'Nickname cannot be empty', visible: true})));
            if(lobbyName.length > 15)
                setErrors(new Map<string, Error>(errors.set('lobbyName', {message: 'Lobby name cannot be longer than 15 characters', visible: true})));
            if(name.length > 15)
                setErrors(new Map<string, Error>(errors.set('name', {message: 'Nickname cannot be longer than 15 characters', visible: true})));
            if(errors.size > 0) return false;
            createLobby({
                name: lobbyName, 
                players: [name],
                lastInteraction: await getTime(),
                isPublic: isPublic,
                password: password,
                host: name,
                isStarted: false,
                startedAt: 0,
                currentRoundStartedAt: 0,
                playerData: {
                    [name]: {
                        role: await getPlayerRole(),
                        isReady: false,
                        isInactive: false,
                        letters: '',
                        points: 0,
                    }
                },
                settings: {
                    boardSize: 15,
                    roundTime: 60,
                    language: 'en',
                    layout: 'default',
                    multiplier: 1,
                },
                tiles: '[]',
                editedTiles: [],
                remainingLetters: '',
                round: -1,
                alert: null,
                wasFirstWordPlaced: false,
            });
        } else{
            if(!name || name.length === 0) 
                setErrors(new Map<string, Error>(errors.set('name', {message: 'Nickname cannot be empty', visible: true})));
            if(name.length > 15)
                setErrors(new Map<string, Error>(errors.set('name', {message: 'Nickname cannot be longer than 15 characters', visible: true})));
            if(props.requiresPassword && password !== props.lobby?.password)
                setErrors(new Map<string, Error>(errors.set('joinPassword', {message: 'Incorrect password', visible: true})));
            if(props.requiresPassword && (!password || password.length === 0))
                setErrors(new Map<string, Error>(errors.set('joinPassword', {message: 'Password cannot be empty', visible: true})));
            if(errors.size > 0) return false;
            setTimeout(async () => {
                const lobbyID = await getLobbyID(props.lobby!);
                const lobby = await getLobby(lobbyID);
                if(lobby?.isStarted) { 
                    setErrors(new Map<string, Error>(errors.set('general', {message: 'This lobby has already started', visible: true})));
                    setTimeout(() => {
                        clearError('general');
                    }, 5000);
                }
                if(lobby?.players.includes(name))
                    setErrors(new Map<string, Error>(errors.set('name', {message: 'This nickname is already taken', visible: true})));
                if(errors.size > 0) return false;
                await joinLobby(lobbyID, name);
                setTimeout(() => {
                    window.location.href = `/scrabblewild/lobby/${lobbyID}`;
                }, 400);
            }, 10);
        }
        return true;
    }

    function clearError(type: string) {
        setErrors(new Map<string, Error>(errors.set(type, {message: errors.get(type)?.message ?? '', visible: false})));
        setTimeout(() => {
            setErrors(current => {
                const newErrors = new Map(current);
                newErrors.delete(type);
                return newErrors;
            });
        }, 250);
    }

    React.useEffect(() => {
        const savedName = localStorage.getItem('name');
        if(savedName && name.length === 0) {
            setName(savedName);
        }
        if(wasOverlayDestroyed) {
            wasOverlayDestroyed = false;
            clearError('general');
            clearError('password');
            clearError('name');
            clearError('lobbyName');
            clearError('joinPassword');
        }
    })

    React.useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if(e.key === 'Enter') {
                const buttons = document.querySelectorAll('.light-background.overlay-button');
                const activeOverlays = document.querySelectorAll('.overlay.active');
                if(buttons && activeOverlays && activeOverlays.length > 0) {
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: 20,
                    });
                    buttons[buttons.length - 1].dispatchEvent(event);
                }
            }
        }
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        }
    })

    return (
        <div className="overlay" onClick={(e)=>{
            const target = e.target as HTMLElement;
            if(target.classList.contains('overlay') && !props.isNonCancellable) {
                removeOverlay();
                target.classList.remove('active');
            }
        }}>
            <div className='overlay-panel'>
                <div className='overlay-title'>{props.title}</div>
                {props.isCreatingLobby && <>
                    <div className="overlay-subtext">Lobby type</div>
                    <Switch items={[
                        {name: 'Public', value: true},
                        {name: 'Private', value: false}
                    ]} 
                    currentValue={isPublic}
                    onChange={(value) => {setIsPublic(value); clearError('password');}}/>
                </>}
                {props.isCreatingLobby && <div className="overlay-subtext large-margin">Settings</div>}
                {props.requiresLobbyName && <Input 
                    value={lobbyName} 
                    onChange={(value) => {setLobbyName(value); clearError('lobbyName');}} 
                    placeholder='Lobby name' 
                    icon='fa-solid fa-bars-staggered'
                />}
                <AnimatedAppear 
                    isVisible={(errors.has("lobbyName") && errors.get('lobbyName')?.visible) ?? false} 
                    height='1.5rem' 
                    childComponent={<div className="overlay-subtext small-margin error">{errors.get('lobbyName')?.message}</div>}
                />
                {props.requiresPassword && <AnimatedAppear 
                    isVisible={!isPublic} 
                    height='3rem' 
                    childComponent={<Input 
                        value={password} 
                        onChange={(value) => {setPassword(value); clearError('password');}} 
                        placeholder='Password' 
                        icon='fa-solid fa-lock' 
                        type='password'
                    />}
                />}
                {props.requiresPassword && <AnimatedAppear 
                    isVisible={(errors.has("password") && errors.get('password')?.visible && !isPublic) ?? false} 
                    height='1.5rem' 
                    childComponent={<div className="overlay-subtext no-margin error">{errors.get('password')?.message}</div>}
                />}
                {(props.isMessage || props.isConfirmMessage) && <div className="overlay-subtext small-margin">{props.message}</div>}
                {!props.isMessage && !props.isConfirmMessage && <>
                    <div className="overlay-subtext small-margin">Join as</div>
                    <Input value={name} onChange={(value) => {setNickname(value); clearError('name')}} placeholder='Nickname' icon='fa-solid fa-signature'/>
                </>}
                <AnimatedAppear 
                    isVisible={(errors.has("name") && errors.get('name')?.visible) ?? false} 
                    height='1.5rem' 
                    childComponent={<div className="overlay-subtext small-margin error">{errors.get('name')?.message}</div>}
                />
                {props.requiresPassword && <AnimatedAppear 
                    isVisible={!props.isCreatingLobby} 
                    height='3rem' 
                    childComponent={<Input 
                        value={password} 
                        onChange={(value) => {setPassword(value); clearError('joinPassword');}} 
                        placeholder='Password' 
                        icon='fa-solid fa-lock' 
                        type='password'
                    />}
                />}
                {props.requiresPassword && <AnimatedAppear 
                    isVisible={(errors.has("joinPassword") && errors.get('joinPassword')?.visible) ?? false}
                    height='1.25rem' 
                    childComponent={<div className="overlay-subtext no-margin error">{errors.get('joinPassword')?.message}</div>}
                />}
                <AnimatedAppear 
                    isVisible={(errors.has("general") && errors.get('general')?.visible) ?? false} 
                    height='1.25rem' 
                    childComponent={<div className="overlay-subtext small-margin error">{errors.get('general')?.message}</div>}
                />
                <div className="overlay-button-container">
                    <Button 
                        text={props.cancelText ?? 'Cancel'} 
                        className={`light-background overlay-button negative ${props.isMessage?'center':''}`} 
                        icon='fa-solid fa-xmark' 
                        onClick={() => {!props.isNonCancellable ? removeOverlay() : window.location.href = '/scrabblewild';}}
                    />
                    {!props.isMessage && <Button 
                        text={props.proceedText ?? ''} 
                        className='light-background overlay-button' 
                        icon={props.customProceedIcon == null?(props.isCreatingLobby?'fa-solid fa-plus':'fa-solid fa-arrow-right-to-bracket'):props.customProceedIcon} 
                        onClick={onProceed} 
                        isLoadingOnClick={props.isProceedButtonLoadingOnClick}
                    />}
                </div>
            </div>
        </div>
    )
}

export default LobbyOverlay