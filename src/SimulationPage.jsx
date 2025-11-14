import { useEffect, useRef, useState } from 'react';
import { Simulation } from './SimulationEngine';

function SimulationPage({ onExit }) {
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
    avgEfficiency: '0.00'
  });

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
    updateStats();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
      const energyPercent = organism.energy / 100;
      const wobble = Math.sin(organism.wobblePhase) * size * 0.15;
      const pulse = Math.sin(organism.pulsePhase) * size * 0.1;

      ctx.save();
      ctx.translate(organism.x, organism.y);

      // Draw vision range (if selected)
      if (selectedOrganism && selectedOrganism.id === organism.id) {
        ctx.strokeStyle = 'rgba(74, 168, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, organism.genome.genes.vision, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.rotate(organism.rotation);

      // === DRAW TENTACLES (behind body) ===
      const tentacleCount = Math.min(Math.floor(organism.genome.genes.size / 3), 6);
      const color = organism.genome.getColor();

      for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * Math.PI * 2;
        const phase = organism.tentaclePhases[i];
        const tentacleLength = size * (0.8 + Math.sin(phase) * 0.3);
        const tentacleWave = Math.sin(phase * 2) * size * 0.4;

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, size * 0.15);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * size * 0.7,
          Math.sin(angle) * size * 0.7
        );

        // Bezier curve for organic tentacle movement
        const ctrlX1 = Math.cos(angle) * size * 1.5 + tentacleWave * Math.cos(angle + Math.PI / 2);
        const ctrlY1 = Math.sin(angle) * size * 1.5 + tentacleWave * Math.sin(angle + Math.PI / 2);
        const endX = Math.cos(angle) * tentacleLength + wobble * Math.cos(angle + Math.PI / 2);
        const endY = Math.sin(angle) * tentacleLength + wobble * Math.sin(angle + Math.PI / 2);

        ctx.quadraticCurveTo(ctrlX1, ctrlY1, endX, endY);
        ctx.stroke();

        // Tentacle tip
        ctx.fillStyle = `rgba(111, 255, 176, ${0.6 + Math.sin(phase) * 0.2})`;
        ctx.beginPath();
        ctx.arc(endX, endY, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      // === DRAW BODY ===
      // Body shape (squished ellipse based on movement)
      const bodyRadiusX = size + pulse;
      const bodyRadiusY = (size + pulse) * organism.bodySquish;

      // Outer glow when eating
      if (organism.isEating) {
        const glowSize = size * (1.5 - organism.eatingTimer / 40);
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(111, 255, 176, 0.8)';
        ctx.fillStyle = 'rgba(111, 255, 176, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 0, glowSize, glowSize, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Main body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body texture/pattern based on efficiency
      const patternDots = Math.floor(organism.genome.genes.efficiency * 8);
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      for (let i = 0; i < patternDots; i++) {
        const dotAngle = (i / patternDots) * Math.PI * 2;
        const dotDist = size * 0.5;
        ctx.beginPath();
        ctx.arc(
          Math.cos(dotAngle) * dotDist,
          Math.sin(dotAngle) * dotDist,
          size * 0.08,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Energy core (pulsing center)
      const coreSize = (size * 0.4 * energyPercent) + pulse * 0.5;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${energyPercent * 0.8})`);
      gradient.addColorStop(0.5, `rgba(111, 255, 176, ${energyPercent * 0.4})`);
      gradient.addColorStop(1, 'rgba(111, 255, 176, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // === DRAW ANTENNAE (in front) ===
      const antennaCount = Math.min(Math.floor(organism.genome.genes.vision / 50), 2);

      for (let i = 0; i < antennaCount; i++) {
        const baseAngle = organism.antennaAngle + (i === 0 ? -0.3 : 0.3);
        const antennaLength = size * 1.2;

        ctx.strokeStyle = `rgba(74, 168, 255, 0.6)`;
        ctx.lineWidth = Math.max(1, size * 0.08);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);

        const wave = Math.sin(organism.wobblePhase + i) * size * 0.2;
        ctx.lineTo(
          Math.cos(baseAngle - organism.rotation) * antennaLength + wave,
          Math.sin(baseAngle - organism.rotation) * antennaLength - size * 0.5
        );
        ctx.stroke();

        // Antenna sensor tip
        ctx.fillStyle = 'rgba(74, 168, 255, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(74, 168, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(
          Math.cos(baseAngle - organism.rotation) * antennaLength + wave,
          Math.sin(baseAngle - organism.rotation) * antennaLength - size * 0.5,
          size * 0.15,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // === LOW ENERGY INDICATOR ===
      if (energyPercent < 0.3) {
        // Flashing warning
        const flash = Math.sin(organism.age * 0.3) > 0;
        if (flash) {
          ctx.strokeStyle = 'rgba(255, 111, 97, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Selection highlight
      if (selectedOrganism && selectedOrganism.id === organism.id) {
        ctx.strokeStyle = 'rgba(111, 255, 176, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -organism.age * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
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
    renderSimulation();
  };

  const handleCloneSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.cloneOrganism(selectedOrganism);
      renderSimulation();
    }
  };

  const handleMutateSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.mutateOrganism(selectedOrganism, 0.5);
      renderSimulation();
    }
  };

  const handleEliminateSelected = () => {
    if (selectedOrganism) {
      simulationRef.current.eliminateOrganism(selectedOrganism);
      setSelectedOrganism(null);
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
                    <div className="trait-bar-fill" style={{ width: `${(parseFloat(stats.avgSpeed) / 6) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgSpeed}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Vision</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseInt(stats.avgVision) / 150) * 100}%` }}></div>
                  </div>
                  <span className="trait-bar-value">{stats.avgVision}</span>
                </div>
                <div className="trait-bar-item">
                  <span className="trait-bar-label">Size</span>
                  <div className="trait-bar-bg">
                    <div className="trait-bar-fill" style={{ width: `${(parseFloat(stats.avgSize) / 20) * 100}%` }}></div>
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
    </div>
  );
}

export default SimulationPage;
