import './style.css';
import useScript from './util/useScript';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import LobbyPage from './pages/lobby';
import { addVhListener } from './util/vh';

function App() {
  useScript('https://kit.fontawesome.com/069af330f2.js');
  addVhListener();

  return (
    <div className="App">
      <Routes>
        <Route path="" element={<Home/>} />
        <Route path="/lobby/:lobbyID?" element={<LobbyPage/>} />
      </Routes>
    </div>
  );
}

export default App;