import { useState } from 'react';
import HomePage from './HomePage';
import SimulationPage from './SimulationPage';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="App">
      {currentPage === 'home' && (
        <HomePage onEnterSimulation={() => setCurrentPage('simulation')} />
      )}
      {currentPage === 'simulation' && (
        <SimulationPage onExit={() => setCurrentPage('home')} />
      )}
    </div>
  );
}

export default App;
