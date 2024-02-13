import '../style.css';
import Logo from '../components/logo';
import Button from '../components/button';
import React from 'react';
import { createOverlay } from '../components/lobbyOverlay';
import { createLobbyListOverlay } from '../components/lobbyListOverlay';
import { Kick } from '../util/firebase';

function Home(){
    React.useEffect(() => {
        setTimeout(() => {
          const subtitle = document.querySelector('.subtitle-container');
          const buttons = document.querySelector('.button-container');
          if(subtitle) {
            subtitle.classList.add('active')
          }
          if(buttons) {
            buttons.classList.add('active')
          }
          const kick = localStorage.getItem('kick');
          if(kick != null){
            createOverlay({title: `Kicked from lobby`, requiresLobbyName: false, requiresPassword: false, isCreatingLobby: false, isNonCancellable: false, isMessage: true, message: kick, cancelText: 'Close'});
            localStorage.removeItem('kick');
          }
        }, 200)
      })

    return (
        <>
            <Logo className='main-logo' animated={true}/>
            <div className="subtitle-container">
                <h3 className='subtitle'>Scrabble as you know it... just a bit </h3>
                <h3 className='subtitle accent'>wilder</h3>
                <h3 className='subtitle'>.</h3>
            </div>
            <div className="button-container">
                <Button text='Find a lobby' icon='fa-solid fa-magnifying-glass' onClick={createLobbyListOverlay}/>
                <Button text='Create lobby' icon='fa-solid fa-plus' onClick={() => {createOverlay({title: 'Create lobby', requiresLobbyName: true, requiresPassword: true, isCreatingLobby: true, proceedText: 'Create', isProceedButtonLoadingOnClick: true})}}/>
            </div>
            <div id="lobby-overlay-placeholder"></div>
            <div id="overlay-placeholder"></div>
        </>
    )
}

export default Home;