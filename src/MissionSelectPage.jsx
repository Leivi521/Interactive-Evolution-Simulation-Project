import { useState, useEffect, useRef } from 'react';
import { MISSIONS } from './MissionSystem';

function MissionSelectPage({ onSelectMission, onBack, missionManager }) {
  const canvasRef = useRef(null);
  const [selectedMission, setSelectedMission] = useState(null);

  // Background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.3 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = `rgba(74, 168, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.fillStyle = 'rgba(12, 12, 16, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const progress = missionManager.getProgress();
  const missions = missionManager.missions;

  const handleMissionClick = (mission) => {
    if (mission.unlocked) {
      setSelectedMission(mission);
    }
  };

  const handleStartMission = () => {
    if (selectedMission) {
      onSelectMission(selectedMission.id);
    }
  };

  return (
    <div className="mission-select-page">
      <canvas ref={canvasRef} className="background-canvas"></canvas>

      <div className="mission-select-content">
        <header className="mission-header">
          <h1 className="mission-title">Evolution Missions</h1>
          <div className="mission-progress">
            <span>{progress.completed} / {progress.total} Missions Complete</span>
            <span className="stars">⭐ {progress.totalStars} / {progress.maxStars} Stars</span>
          </div>
          <button onClick={onBack} className="back-button">← Back</button>
        </header>

        <div className="mission-grid">
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              className={`mission-card ${mission.unlocked ? 'unlocked' : 'locked'} ${selectedMission?.id === mission.id ? 'selected' : ''} ${mission.completed ? 'completed' : ''}`}
              onClick={() => handleMissionClick(mission)}
            >
              <div className="mission-number">{index + 1}</div>
              <h3 className="mission-name">{mission.name}</h3>

              {mission.completed && (
                <div className="mission-stars">
                  {[...Array(mission.stars)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
              )}

              {!mission.unlocked && (
                <div className="mission-locked">
                  <span className="lock-icon">🔒</span>
                  <span>Locked</span>
                </div>
              )}

              {mission.unlocked && !mission.completed && (
                <div className="mission-preview">
                  <p className="mission-description">{mission.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedMission && (
          <div className="mission-detail-panel">
            <h2>{selectedMission.name}</h2>
            <p className="detail-description">{selectedMission.description}</p>

            <div className="objectives-list">
              <h3>Objectives:</h3>
              {selectedMission.objectives.map((obj) => (
                <div key={obj.id} className="objective-item">
                  <span className="objective-icon">•</span>
                  <span>{obj.description}</span>
                </div>
              ))}
            </div>

            {selectedMission.tutorial && (
              <div className="tutorial-box">
                <h4>💡 Tip:</h4>
                <p>{selectedMission.tutorial}</p>
              </div>
            )}

            <div className="mission-actions">
              <button onClick={handleStartMission} className="start-mission-button">
                {selectedMission.completed ? 'Replay Mission' : 'Start Mission'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MissionSelectPage;
