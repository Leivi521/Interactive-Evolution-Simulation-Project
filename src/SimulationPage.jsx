import { useEffect, useRef, useState } from 'react';
import { Simulation } from './SimulationEngine';
import { audioManager } from './AudioSystem';

function SimulationPage({ onExit, missionId, missionManager, achievementManager, encyclopedia }) {
  const canvasRef = useRef(null);
  const fitnessGraphRef = useRef(null);
  const simulationRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [stats, setStats] = useState({
    population: 0,
    avgFitness: '0.00',
    bestFitness: '0.00',
    foodCount: 0,
    avgSpeed: '0.00',
    avgVision: '0',
    avgSize: '0.00',
    avgEfficiency: '0.00',
    avgAggression: '0.00',
    avgDietType: '0.00',
    avgMutationStability: '0.00',
    temperature: '20.0',
    toxicity: '0.0'
  });

  const [missionStatus, setMissionStatus] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);

  const [selectedOrganism, setSelectedOrganism] = useState(null);
  const [activeTool, setActiveTool] = useState('select');

  const [controls, setControls] = useState({
    mutationRate: 10,
    selectionPressure: 50,
    foodAbundance: 50,
    simSpeed: 1
  });

  // Initialize simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    simulationRef.current = new Simulation(canvas.width, canvas.height, 30);

    // Start mission if one is selected
    if (missionId && missionManager) {
      missionManager.startMission(missionId, simulationRef.current);
    }

    updateStats();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [missionId]);

  // Main animation loop
  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      const simulation = simulationRef.current;
      if (!simulation) return;

      // Update simulation multiple times based on speed
      for (let i = 0; i < controls.simSpeed; i++) {
        simulation.update();
      }

      renderSimulation();
      updateStats();
      renderFitnessGraph();

      // Update encyclopedia
      if (encyclopedia) {
        encyclopedia.updateFromPopulation(simulation.population, simulation.generation);
      }

      // Check achievements
      if (achievementManager) {
        const unlocked = achievementManager.checkAchievements(simulation);
        if (unlocked.length > 0) {
          setNewAchievements(unlocked);
          setShowAchievement(unlocked[0]); // Show first achievement
          setTimeout(() => setShowAchievement(null), 3000); // Hide after 3 seconds
        }
      }

      // Update mission status
      if (missionId && missionManager) {
        const status = missionManager.updateMission(simulation);
        setMissionStatus(status);

        // Check if mission complete
        if (status && status.mission.completed) {
          achievementManager?.trackMissionComplete(status.mission.stars);
        }
      }

      setGeneration(simulation.generation);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, controls.simSpeed]);

  // Render simulation on canvas
  const renderSimulation = () => {
    const canvas = canvasRef.current;
    const simulation = simulationRef.current;
    if (!canvas || !simulation) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#0C0C10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    simulation.environment.food.forEach(food => {
      ctx.fillStyle = 'rgba(111, 255, 176, 0.6)';
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(111, 255, 176, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw organisms
    simulation.population.forEach(organism => {
      if (!organism.alive) return;

      const size = organism.genome.genes.size;
      const genes = organism.genome.genes;

      // Draw vision range (if selected)
      if (selectedOrganism && selectedOrganism.id === organism.id) {
        ctx.strokeStyle = 'rgba(74, 168, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(organism.x, organism.y, genes.vision, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw organism body with trait-based appearance
      let baseColor = organism.genome.getColor();

      // Modify color based on diet type
      if (genes.dietType > 0.6) {
        // Carnivores: more red
        baseColor = `hsl(0, 70%, 50%)`;
      } else if (genes.dietType < 0.3) {
        // Herbivores: more green
        baseColor = `hsl(120, 60%, 50%)`;
      }

      ctx.fillStyle = baseColor;
      ctx.beginPath();

      // Shape based on aggression
      if (genes.aggression > 7) {
        // Aggressive organisms: spiky shape
        const spikes = 6;
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2;
          const isSpike = i % 2 === 0;
          const r = isSpike ? size * 1.3 : size * 0.7;
          const x = organism.x + Math.cos(angle) * r;
          const y = organism.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        // Peaceful organisms: circular
        ctx.arc(organism.x, organism.y, size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Add glow for high-efficiency organisms
      if (genes.efficiency > 0.8) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Energy indicator
      const energyPercent = organism.energy / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${energyPercent * 0.5})`;
      ctx.beginPath();
      ctx.arc(organism.x, organism.y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Speed indicator (trailing effect for fast organisms)
      if (genes.speed > 6) {
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(organism.x - organism.velocity.x * 2, organism.y - organism.velocity.y * 2);
        ctx.lineTo(organism.x, organism.y);
        ctx.stroke();
      }

      // Selection highlight
      if (selectedOrganism && selectedOrganism.id === organism.id) {
        ctx.strokeStyle = 'rgba(111, 255, 176, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(organism.x, organism.y, size + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  // Update statistics
  const updateStats = () => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    setStats(simulation.getStats());
  };

  // Render fitness graph
  const renderFitnessGraph = () => {
    const canvas = fitnessGraphRef.current;
    const simulation = simulationRef.current;
    if (!canvas || !simulation) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const avgData = simulation.stats.avgFitness;
    const bestData = simulation.stats.bestFitness;

    if (avgData.length < 2) return;

    const maxValue = Math.max(...bestData, 100);
    const step = canvas.width / Math.max(avgData.length - 1, 1);

    // Draw best fitness
    ctx.strokeStyle = 'rgba(111, 255, 176, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    bestData.forEach((value, i) => {
      const x = i * step;
      const y = canvas.height - (value / maxValue) * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw average fitness
    ctx.strokeStyle = 'rgba(74, 168, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    avgData.forEach((value, i) => {
      const x = i * step;
      const y = canvas.height - (value / maxValue) * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const simulation = simulationRef.current;
    if (!canvas || !simulation) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'select') {
      // Find clicked organism
      const clicked = simulation.population.find(org => {
        if (!org.alive) return false;
        const dist = Math.hypot(org.x - x, org.y - y);
        return dist < org.genome.genes.size + 5;
      });

      setSelectedOrganism(clicked || null);
    } else if (activeTool === 'food') {
      // Add food
      simulation.environment.food.push({
        x,
        y,
        energy: 20,
        radius: 4
      });
      renderSimulation();
    }
  };

  // Control handlers
  const handlePlayPause = () => {
    if (isRunning) {
      simulationRef.current.pause();
    } else {
      simulationRef.current.start();
    }
    setIsRunning(!isRunning);
  };

  const handleNextGen = () => {
    simulationRef.current.nextGeneration();
    setGeneration(simulationRef.current.generation);
    updateStats();
    renderSimulation();
  };

  const handleReset = () => {
    simulationRef.current.reset();
    setIsRunning(false);
    setGeneration(0);
    setSelectedOrganism(null);
    updateStats();
    renderSimulation();
  };

  const handleControlChange = (name, value) => {
    setControls(prev => ({ ...prev, [name]: value }));

    const simulation = simulationRef.current;
    if (!simulation) return;

    if (name === 'mutationRate') {
      simulation.mutationRate = value / 100;
    } else if (name === 'selectionPressure') {
      simulation.selectionPressure = value / 100;
    } else if (name === 'foodAbundance') {
      simulation.environment.foodAbundance = value;
    }
  };

  const handleEvent = (eventType) => {
    simulationRef.current.triggerEvent(eventType);
    achievementManager?.trackIntervention('event');
    renderSimulation();
  };

  const handleCloneSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.cloneOrganism(selectedOrganism);
      achievementManager?.trackIntervention('clone');
      renderSimulation();
    }
  };

  const handleMutateSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.mutateOrganism(selectedOrganism, 0.5);
      achievementManager?.trackIntervention('mutate');
      renderSimulation();
    }
  };

  const handleEliminateSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.eliminateOrganism(selectedOrganism);
      achievementManager?.trackIntervention('eliminate');
      setSelectedOrganism(null);
      renderSimulation();
    }
  };

  const handleEditGene = (geneName, value) => {
    if (selectedOrganism) {
      simulationRef.current.editGene(selectedOrganism, geneName, value);
      achievementManager?.trackIntervention('edit');
      renderSimulation();
    }
  };

  return (
    <div className="page active">
      <div className="simulation-layout">
        {/* Left Sidebar */}
        <aside className="sidebar left-sidebar">
          <div className="tool-palette">
            <button
              className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
              onClick={() => setActiveTool('select')}
              title="Select Organisms"
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 3l7 15 3-7 7-3z" />
              </svg>
            </button>
            <button
              className={`tool-btn ${activeTool === 'food' ? 'active' : ''}`}
              onClick={() => setActiveTool('food')}
              title="Add Food Source"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Simulation Area */}
        <main className="simulation-main">
          <div className="simulation-controls-top">
            <div className="control-group">
              <button id="play-pause" className="control-btn" onClick={handlePlayPause}>
                <span className="icon">{isRunning ? '�' : '�'}</span>
                <span className="label">{isRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button className="control-btn" onClick={handleNextGen} disabled={isRunning}>
                <span className="label">Next Generation</span>
              </button>
            </div>

            <div className="generation-display">
              <span className="gen-label">Generation</span>
              <span className="gen-value">{generation}</span>
            </div>

            <div className="control-group">
              <button className="control-btn secondary" onClick={handleReset}>Reset</button>
              <button className="control-btn secondary" onClick={onExit}>Exit</button>
            </div>
          </div>

          <div className="canvas-container">
            <canvas ref={canvasRef} id="simulation-canvas" onClick={handleCanvasClick}></canvas>
          </div>

          <div className="intervention-controls">
            <div className="control-panel">
              <div className="control-item">
                <label className="control-label">
                  <span>Mutation Rate</span>
                  <span className="control-value">{controls.mutationRate}%</span>
                </label>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="100"
                  value={controls.mutationRate}
                  onChange={e => handleControlChange('mutationRate', parseInt(e.target.value))}
                />
              </div>

              <div className="control-item">
                <label className="control-label">
                  <span>Selection Pressure</span>
                  <span className="control-value">{controls.selectionPressure}%</span>
                </label>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="100"
                  value={controls.selectionPressure}
                  onChange={e => handleControlChange('selectionPressure', parseInt(e.target.value))}
                />
              </div>

              <div className="control-item">
                <label className="control-label">
                  <span>Food Abundance</span>
                  <span className="control-value">{controls.foodAbundance}%</span>
                </label>
                <input
                  type="range"
                  className="slider"
                  min="10"
                  max="100"
                  value={controls.foodAbundance}
                  onChange={e => handleControlChange('foodAbundance', parseInt(e.target.value))}
                />
              </div>

              <div className="control-item">
                <label className="control-label">
                  <span>Simulation Speed</span>
                  <span className="control-value">{controls.simSpeed}x</span>
                </label>
                <input
                  type="range"
                  className="slider"
                  min="1"
                  max="10"
                  value={controls.simSpeed}
                  onChange={e => handleControlChange('simSpeed', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="event-buttons">
              <button className="event-btn" onClick={() => handleEvent('meteor')}>
                <span className="event-icon">☄️</span>
                <span>Meteor Strike</span>
              </button>
              <button className="event-btn" onClick={() => handleEvent('ice-age')}>
                <span className="event-icon">❄️</span>
                <span>Ice Age</span>
              </button>
              <button className="event-btn" onClick={() => handleEvent('abundance')}>
                <span className="event-icon">🌱</span>
                <span>Resource Boom</span>
              </button>
              <button className="event-btn" onClick={() => handleEvent('plague')}>
                <span className="event-icon">☣️</span>
                <span>Plague</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar right-sidebar">
          <div className="data-panels">
            {/* Statistics Panel */}
            <div className="data-panel">
              <h3 className="panel-title">Population Stats</h3>
              <div className="stat-items">
                <div className="stat-item">
                  <span className="stat-label">Population</span>
                  <span className="stat-value">{stats.population}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Fitness</span>
                  <span className="stat-value">{stats.avgFitness}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Best Fitness</span>
                  <span className="stat-value">{stats.bestFitness}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Food Available</span>
                  <span className="stat-value">{stats.foodCount}</span>
                </div>
              </div>
            </div>

            {/* Fitness Graph */}
            <div className="data-panel">
              <h3 className="panel-title">Fitness Over Time</h3>
              <canvas ref={fitnessGraphRef} className="data-canvas" width="268" height="150"></canvas>
            </div>

            {/* Trait Distribution */}
            <div className="data-panel">
              <h3 className="panel-title">Trait Averages</h3>
              <div className="trait-bars">
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Speed</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseFloat(stats.avgSpeed) / 10) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgSpeed}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Vision</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseInt(stats.avgVision) / 200) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgVision}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Size</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseFloat(stats.avgSize) / 30) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgSize}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Efficiency</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${parseFloat(stats.avgEfficiency) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgEfficiency}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Aggression</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseFloat(stats.avgAggression) / 10) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgAggression}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Diet</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${parseFloat(stats.avgDietType) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{(parseFloat(stats.avgDietType) * 100).toFixed(0)}%</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Stability</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${parseFloat(stats.avgMutationStability) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgMutationStability}</span>
                </div>
              </div>
            </div>

            {/* Environment Panel */}
            <div className="data-panel">
              <h3 className="panel-title">Environment</h3>
              <div className="stat-items">
                <div className="stat-item">
                  <span className="stat-label">Temperature</span>
                  <span className="stat-value">{stats.temperature}°C</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Toxicity</span>
                  <span className="stat-value">{stats.toxicity}</span>
                </div>
              </div>
            </div>

            {/* Selected Organism */}
            {selectedOrganism && (
              <div className="data-panel">
                <h3 className="panel-title">Selected Organism</h3>
                <div className="stat-items">
                  <div className="stat-item">
                    <span className="stat-label">Energy</span>
                    <span className="stat-value">{selectedOrganism.energy.toFixed(0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Food</span>
                    <span className="stat-value">{selectedOrganism.foodCollected}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Age</span>
                    <span className="stat-value">{selectedOrganism.age}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Fitness</span>
                    <span className="stat-value">{selectedOrganism.fitness.toFixed(1)}</span>
                  </div>
                </div>
                <div className="genome-editor">
                  <button className="genome-btn" onClick={handleCloneSelected}>Clone</button>
                  <button className="genome-btn" onClick={handleMutateSelected}>Mutate</button>
                  <button className="genome-btn danger" onClick={handleEliminateSelected}>Eliminate</button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mission Status Overlay */}
      {missionStatus && (
        <div className="mission-status-overlay">
          <div className="mission-info">
            <h3>{missionStatus.mission.name}</h3>
            <div className="mission-objectives">
              {missionStatus.objectives.map((obj) => (
                <div key={obj.id} className={`objective ${obj.completed ? 'completed' : ''}`}>
                  <span className="objective-checkbox">{obj.completed ? '✓' : '○'}</span>
                  <span>{obj.description}</span>
                </div>
              ))}
            </div>
            {missionStatus.mission.completed && (
              <div className="mission-complete">
                <h2>Mission Complete!</h2>
                <div className="stars">
                  {[...Array(missionStatus.mission.stars)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      {showAchievement && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <span className="achievement-icon">{showAchievement.icon}</span>
            <div className="achievement-text">
              <h4>Achievement Unlocked!</h4>
              <p>{showAchievement.name}</p>
              <small>{showAchievement.description}</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationPage;
