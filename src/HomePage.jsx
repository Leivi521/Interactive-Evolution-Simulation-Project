import { useEffect, useRef, useState } from 'react';

function HomePage({ onEnterSimulation }) {
  const heroCanvasRef = useRef(null);
  const genomeCanvasRef = useRef(null);
  const featureCanvasRefs = useRef([]);
  const [traitValues, setTraitValues] = useState({
    speed: 0,
    vision: 0,
    size: 0,
    efficiency: 0
  });

  // Hero organism animation
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle system for hero background
    const particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = `rgba(111, 255, 176, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Central organism
    let angle = 0;
    const nodes = 6;

    function animate() {
      ctx.fillStyle = 'rgba(12, 12, 16, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(111, 255, 176, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Draw central evolving organism
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80 + Math.sin(angle * 0.5) * 20;

      ctx.strokeStyle = 'rgba(111, 255, 176, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i <= nodes; i++) {
        const nodeAngle = (i / nodes) * Math.PI * 2 + angle;
        const x = centerX + Math.cos(nodeAngle) * radius;
        const y = centerY + Math.sin(nodeAngle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.stroke();

      // Draw nodes
      for (let i = 0; i < nodes; i++) {
        const nodeAngle = (i / nodes) * Math.PI * 2 + angle;
        const x = centerX + Math.cos(nodeAngle) * radius;
        const y = centerY + Math.sin(nodeAngle) * radius;

        ctx.fillStyle = 'rgba(111, 255, 176, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(111, 255, 176, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      angle += 0.01;
      requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Genome visualization
  useEffect(() => {
    const canvas = genomeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const genes = [];
    const geneCount = 50;

    class Gene {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 4 + 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.fillStyle = 'rgba(74, 168, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < geneCount; i++) {
      genes.push(new Gene());
    }

    let animationId;
    function animate() {
      ctx.fillStyle = 'rgba(12, 12, 16, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      genes.forEach((gene, i) => {
        gene.update();
        gene.draw();

        // Draw connections
        genes.slice(i + 1).forEach(other => {
          const dist = Math.hypot(gene.x - other.x, gene.y - other.y);
          if (dist < 80) {
            ctx.strokeStyle = `rgba(74, 168, 255, ${0.2 * (1 - dist / 80)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gene.x, gene.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Animate trait values on mount
  useEffect(() => {
    const targetValues = {
      speed: 4.2,
      vision: 85,
      size: 12,
      efficiency: 0.78
    };

    const duration = 2000;
    const startTime = Date.now();

    const animateValues = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setTraitValues({
        speed: (targetValues.speed * progress).toFixed(2),
        vision: Math.floor(targetValues.vision * progress),
        size: (targetValues.size * progress).toFixed(2),
        efficiency: (targetValues.efficiency * progress).toFixed(2)
      });

      if (progress < 1) {
        requestAnimationFrame(animateValues);
      }
    };

    animateValues();
  }, []);

  // Feature canvases - simple animations
  useEffect(() => {
    featureCanvasRefs.current.forEach((canvas, index) => {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const organisms = [];
      const organismCount = 8;

      for (let i = 0; i < organismCount; i++) {
        organisms.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 8 + 4,
          hue: Math.random() * 360
        });
      }

      function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        organisms.forEach(org => {
          org.x += org.vx;
          org.y += org.vy;

          if (org.x < 0 || org.x > canvas.width) org.vx *= -1;
          if (org.y < 0 || org.y > canvas.height) org.vy *= -1;

          ctx.fillStyle = `hsla(${org.hue}, 70%, 60%, 0.8)`;
          ctx.beginPath();
          ctx.arc(org.x, org.y, org.size, 0, Math.PI * 2);
          ctx.fill();
        });

        requestAnimationFrame(animate);
      }

      animate();
    });
  }, []);

  return (
    <div className="page active">
      {/* Hero Section */}
      <section className="hero-section">
        <canvas ref={heroCanvasRef} id="hero-organism"></canvas>
        <div className="hero-content">
          <h1 className="hero-title">Where Digital Life Learns to Evolve.</h1>
          <p className="hero-subtitle">An experimental ecosystem shaped by you.</p>
          <button onClick={onEnterSimulation} className="cta-button">
            Enter the Simulation
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-visual">
              <canvas
                className="feature-canvas"
                ref={el => featureCanvasRefs.current[0] = el}
              ></canvas>
            </div>
            <h3 className="feature-title">Natural Evolution</h3>
            <p className="feature-description">
              Watch digital organisms adapt and evolve through generations of natural selection
            </p>
          </div>

          <div className="feature-card central">
            <div className="feature-visual">
              <canvas
                className="feature-canvas"
                ref={el => featureCanvasRefs.current[1] = el}
              ></canvas>
            </div>
            <h3 className="feature-title">Divine Intervention</h3>
            <p className="feature-description">
              Shape evolution through direct manipulation of genes, traits, and environment
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-visual">
              <canvas
                className="feature-canvas"
                ref={el => featureCanvasRefs.current[2] = el}
              ></canvas>
            </div>
            <h3 className="feature-title">Deep Analysis</h3>
            <p className="feature-description">
              Track lineages, analyze genomes, and visualize evolutionary patterns over time
            </p>
          </div>
        </div>
      </section>

      {/* Genome Section */}
      <section className="genome-section">
        <div className="genome-layout">
          <div className="genome-visual">
            <canvas ref={genomeCanvasRef} id="genome-canvas"></canvas>
          </div>
          <div className="genome-traits">
            <h2 className="section-title">Genetic Architecture</h2>
            <div className="trait-cards">
              <div className="trait-card">
                <span className="trait-icon">°</span>
                <span className="trait-name">Speed</span>
                <span className="trait-value">{traitValues.speed}</span>
              </div>
              <div className="trait-card">
                <span className="trait-icon">=A</span>
                <span className="trait-name">Vision</span>
                <span className="trait-value">{traitValues.vision}</span>
              </div>
              <div className="trait-card">
                <span className="trait-icon">$</span>
                <span className="trait-name">Size</span>
                <span className="trait-value">{traitValues.size}</span>
              </div>
              <div className="trait-card">
                <span className="trait-icon">ô</span>
                <span className="trait-name">Efficiency</span>
                <span className="trait-value">{traitValues.efficiency}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intervention Preview */}
      <section className="intervention-section">
        <h2 className="section-title">Command the Evolution</h2>
        <div className="intervention-tools">
          <div className="tool-item">
            <div className="tool-icon">>Ï</div>
            <span className="tool-label">Mutation Rate</span>
          </div>
          <div className="tool-item">
            <div className="tool-icon">ñ</div>
            <span className="tool-label">Selection Pressure</span>
          </div>
          <div className="tool-item">
            <div className="tool-icon">üåç</div>
            <span className="tool-label">Environment</span>
          </div>
          <div className="tool-item">
            <div className="tool-icon">‚òÑ</div>
            <span className="tool-label">Catastrophic Events</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
