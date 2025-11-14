import { useState, useRef } from 'react';
import HomePage from './HomePage';
import SimulationPage from './SimulationPage';
import MissionSelectPage from './MissionSelectPage';
import { MissionManager } from './MissionSystem';
import { AchievementManager } from './AchievementSystem';
import { Encyclopedia } from './EncyclopediaSystem';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMission, setSelectedMission] = useState(null);

  // Initialize managers (persistent across sessions)
  const missionManagerRef = useRef(new MissionManager());
  const achievementManagerRef = useRef(new AchievementManager());
  const encyclopediaRef = useRef(new Encyclopedia());

  const handleEnterSimulation = (mode = 'sandbox') => {
    if (mode === 'missions') {
      setCurrentPage('missions');
    } else {
      setSelectedMission(null);
      setCurrentPage('simulation');
    }
  };

  const handleSelectMission = (missionId) => {
    setSelectedMission(missionId);
    setCurrentPage('simulation');
  };

  const handleExitSimulation = () => {
    setSelectedMission(null);
    setCurrentPage('home');
  };

  const handleBackFromMissions = () => {
    setCurrentPage('home');
  };

  return (
    <div className="App">
      {currentPage === 'home' && (
        <HomePage
          onEnterSimulation={handleEnterSimulation}
          missionManager={missionManagerRef.current}
          achievementManager={achievementManagerRef.current}
        />
      )}
      {currentPage === 'missions' && (
        <MissionSelectPage
          onSelectMission={handleSelectMission}
          onBack={handleBackFromMissions}
          missionManager={missionManagerRef.current}
        />
      )}
      {currentPage === 'simulation' && (
        <SimulationPage
          onExit={handleExitSimulation}
          missionId={selectedMission}
          missionManager={missionManagerRef.current}
          achievementManager={achievementManagerRef.current}
          encyclopedia={encyclopediaRef.current}
        />
      )}
    </div>
  );
}

export default App;
