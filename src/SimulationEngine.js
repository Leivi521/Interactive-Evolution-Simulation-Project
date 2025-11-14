/**
 * EVOLUTION SIMULATION ENGINE
 * Core logic for genetic simulation, organisms, and evolution
 */

// ============================================
// GENOME CLASS
// ============================================
export class Genome {
  constructor(genes = null) {
    if (genes) {
      this.genes = { ...genes };
    } else {
      // Initialize with random genes
      this.genes = {
        speed: Math.random() * 5 + 1,        // 1-6
        vision: Math.random() * 100 + 50,    // 50-150
        size: Math.random() * 15 + 5,        // 5-20
        efficiency: Math.random() * 0.5 + 0.5, // 0.5-1.0
        aggression: Math.random() * 10,      // 0-10 (0=passive, 10=aggressive)
        dietType: Math.random(),             // 0=herbivore, 0.5=omnivore, 1=carnivore
        mutationStability: Math.random() * 0.5 + 0.5 // 0.5-1.0 (higher=more stable)
      };
    }

    // Visual traits (aesthetic, not functional)
    this.color = genes?.color || {
      h: Math.random() * 360,
      s: Math.random() * 30 + 50,
      l: Math.random() * 30 + 40
    };
  }

  // Create a copy of the genome
  clone() {
    return new Genome({
      ...this.genes,
      color: { ...this.color }
    });
  }

  // Mutate the genome
  mutate(mutationRate = 0.1) {
    // Adjust mutation rate based on stability
    const effectiveMutationRate = mutationRate * (2 - this.genes.mutationStability);

    const mutate = (value, range, min = 0, max = Infinity) => {
      if (Math.random() < effectiveMutationRate) {
        const change = (Math.random() - 0.5) * range * 0.3;
        return Math.max(min, Math.min(max, value + change));
      }
      return value;
    };

    this.genes.speed = mutate(this.genes.speed, 5, 0.5, 10);
    this.genes.vision = mutate(this.genes.vision, 100, 30, 200);
    this.genes.size = mutate(this.genes.size, 15, 3, 30);
    this.genes.efficiency = mutate(this.genes.efficiency, 0.5, 0.3, 1.0);
    this.genes.aggression = mutate(this.genes.aggression, 10, 0, 10);
    this.genes.dietType = mutate(this.genes.dietType, 1, 0, 1);
    this.genes.mutationStability = mutate(this.genes.mutationStability, 0.5, 0.3, 1.0);

    // Mutate color slightly
    if (Math.random() < effectiveMutationRate) {
      this.color.h = (this.color.h + (Math.random() - 0.5) * 60) % 360;
    }
  }

  // Crossover with another genome
  static crossover(parent1, parent2) {
    const child = new Genome();

    // Mix genes from both parents
    for (let gene in parent1.genes) {
      child.genes[gene] = Math.random() < 0.5
        ? parent1.genes[gene]
        : parent2.genes[gene];
    }

    // Average the colors
    child.color = {
      h: (parent1.color.h + parent2.color.h) / 2,
      s: (parent1.color.s + parent2.color.s) / 2,
      l: (parent1.color.l + parent2.color.l) / 2
    };

    return child;
  }

  getColor() {
    return `hsl(${this.color.h}, ${this.color.s}%, ${this.color.l}%)`;
  }
}

// ============================================
// ORGANISM CLASS
// ============================================
export class Organism {
  constructor(x, y, genome = null) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.genome = genome || new Genome();
    this.x = x;
    this.y = y;
    this.energy = 100;
    this.foodCollected = 0;
    this.age = 0;
    this.alive = true;
    this.fitness = 0;
    this.velocity = { x: 0, y: 0 };
    this.target = null;
  }

  // Update organism state
  update(environment, deltaTime = 1, allOrganisms = []) {
    if (!this.alive) return;

    this.age += deltaTime;

    // Determine behavior based on diet type and aggression
    const isCarnivore = this.genome.genes.dietType > 0.6;
    const isAggressive = this.genome.genes.aggression > 5;

    if (isCarnivore || isAggressive) {
      // Hunt other organisms
      const nearestPrey = this.findNearestPrey(allOrganisms);
      if (nearestPrey) {
        this.target = nearestPrey;
        this.moveTowards(nearestPrey);
        // Try to attack if close enough
        this.attackOrganism(nearestPrey);
      } else {
        // Fall back to food if no prey
        const nearestFood = this.findNearestFood(environment.food);
        if (nearestFood) {
          this.target = nearestFood;
          this.moveTowards(nearestFood);
        } else {
          this.randomWalk();
        }
      }
    } else {
      // Herbivore behavior - seek food
      const nearestFood = this.findNearestFood(environment.food);
      if (nearestFood) {
        this.target = nearestFood;
        this.moveTowards(nearestFood);
      } else {
        this.randomWalk();
      }
    }

    // Move
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;

    // Wrap around edges
    this.x = (this.x + environment.width) % environment.width;
    this.y = (this.y + environment.height) % environment.height;

    // Energy cost based on movement, size, and aggression
    const movementCost = (Math.abs(this.velocity.x) + Math.abs(this.velocity.y)) *
                          (this.genome.genes.size / 10) *
                          (1 / this.genome.genes.efficiency) *
                          (1 + this.genome.genes.aggression / 20); // Aggressive organisms cost more

    this.energy -= movementCost * deltaTime * 0.1;

    // Apply temperature effects if present
    if (environment.temperature !== undefined) {
      const tempStress = Math.abs(environment.temperature - 20) / 50;
      this.energy -= tempStress * deltaTime * 0.05;
    }

    // Check if organism dies
    if (this.energy <= 0) {
      this.alive = false;
    }

    // Try to collect food
    this.collectFood(environment);
  }

  findNearestPrey(organisms) {
    let nearest = null;
    let minDist = this.genome.genes.vision;

    for (let org of organisms) {
      if (org === this || !org.alive) continue;

      // Only hunt smaller or similar-sized organisms
      if (org.genome.genes.size > this.genome.genes.size * 1.2) continue;

      const dist = this.distance(org);
      if (dist < minDist) {
        minDist = dist;
        nearest = org;
      }
    }

    return nearest;
  }

  findNearestFood(foodArray) {
    let nearest = null;
    let minDist = this.genome.genes.vision;

    for (let food of foodArray) {
      const dist = this.distance(food);
      if (dist < minDist) {
        minDist = dist;
        nearest = food;
      }
    }

    return nearest;
  }

  moveTowards(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.velocity.x = (dx / dist) * this.genome.genes.speed;
      this.velocity.y = (dy / dist) * this.genome.genes.speed;
    }
  }

  randomWalk() {
    // Slightly adjust velocity for organic movement
    this.velocity.x += (Math.random() - 0.5) * 0.5;
    this.velocity.y += (Math.random() - 0.5) * 0.5;

    // Limit max speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.genome.genes.speed) {
      this.velocity.x = (this.velocity.x / speed) * this.genome.genes.speed;
      this.velocity.y = (this.velocity.y / speed) * this.genome.genes.speed;
    }
  }

  collectFood(environment) {
    for (let i = environment.food.length - 1; i >= 0; i--) {
      const food = environment.food[i];
      if (this.distance(food) < this.genome.genes.size) {
        this.energy += food.energy;
        this.foodCollected++;
        environment.food.splice(i, 1);
        break;
      }
    }
  }

  distance(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate fitness score
  calculateFitness() {
    // Fitness = food collected - energy spent + survival time bonus
    const foodScore = this.foodCollected * 10;
    const survivalBonus = this.age * 0.1;
    const efficiencyScore = this.energy > 0 ? this.energy : 0;
    const combatBonus = (this.kills || 0) * 15; // Bonus for predators

    this.fitness = foodScore + survivalBonus + efficiencyScore + combatBonus;
    return this.fitness;
  }

  // Attack another organism (for predators/aggressive organisms)
  attackOrganism(target) {
    if (!this.alive || !target.alive) return false;

    // Check if close enough to attack
    const dist = this.distance(target);
    if (dist > this.genome.genes.size + target.genome.genes.size) return false;

    // Combat based on size and aggression
    const attackPower = this.genome.genes.size * (1 + this.genome.genes.aggression / 10);
    const defensePower = target.genome.genes.size * (1 + target.genome.genes.speed / 10);

    if (attackPower > defensePower) {
      target.alive = false;
      this.energy += target.energy * 0.5; // Gain some energy from kill
      this.kills = (this.kills || 0) + 1;
      return true;
    }

    return false;
  }

  // Clone this organism
  clone() {
    const clonedGenome = this.genome.clone();
    const clone = new Organism(this.x, this.y, clonedGenome);
    clone.energy = 100;
    return clone;
  }
}

// ============================================
// FOOD CLASS
// ============================================
export class Food {
  constructor(x, y, energy = 20) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.radius = 4;
  }
}

// ============================================
// ENVIRONMENT CLASS
// ============================================
export class Environment {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.food = [];
    this.foodAbundance = 50; // Percentage
    this.temperature = 20; // Neutral temperature (0-40 range, 20 is optimal)
    this.toxicity = 0; // Environmental toxicity (0-10)
  }

  // Spawn food in the environment
  spawnFood(count) {
    for (let i = 0; i < count; i++) {
      this.food.push(new Food(
        Math.random() * this.width,
        Math.random() * this.height
      ));
    }
  }

  // Maintain food levels
  maintainFood() {
    const targetFoodCount = Math.floor((this.width * this.height) / 5000 * (this.foodAbundance / 50));
    const foodDeficit = targetFoodCount - this.food.length;

    if (foodDeficit > 0) {
      this.spawnFood(Math.min(foodDeficit, 5)); // Spawn gradually
    }
  }

  update() {
    this.maintainFood();
  }
}

// ============================================
// SIMULATION CLASS
// ============================================
export class Simulation {
  constructor(width, height, populationSize = 30) {
    this.environment = new Environment(width, height);
    this.population = [];
    this.generation = 0;
    this.running = false;
    this.generationLength = 1000; // Frames per generation
    this.generationTimer = 0;

    // Evolution parameters
    this.mutationRate = 0.1;
    this.selectionPressure = 0.5; // Top 50% survive

    // Statistics
    this.stats = {
      avgFitness: [],
      bestFitness: [],
      avgSpeed: [],
      avgVision: [],
      avgSize: [],
      avgEfficiency: [],
      avgAggression: [],
      avgDietType: [],
      avgMutationStability: []
    };

    // Initialize population
    this.initializePopulation(populationSize);

    // Spawn initial food
    this.environment.spawnFood(50);
  }

  initializePopulation(size) {
    this.population = [];
    for (let i = 0; i < size; i++) {
      const x = Math.random() * this.environment.width;
      const y = Math.random() * this.environment.height;
      this.population.push(new Organism(x, y));
    }
  }

  update() {
    if (!this.running) return;

    // Update environment
    this.environment.update();

    // Update all organisms (pass population for predator behavior)
    for (let organism of this.population) {
      organism.update(this.environment, 1, this.population);
    }

    // Check if generation should end
    this.generationTimer++;
    if (this.generationTimer >= this.generationLength || this.allDead()) {
      this.nextGeneration();
      this.generationTimer = 0;
    }
  }

  allDead() {
    return this.population.every(org => !org.alive);
  }

  // Evolution: Create next generation
  nextGeneration() {
    // Calculate fitness for all organisms
    for (let organism of this.population) {
      organism.calculateFitness();
    }

    // Sort by fitness
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Record statistics
    this.recordStats();

    // Select top performers
    const survivalCount = Math.floor(this.population.length * this.selectionPressure);
    const survivors = this.population.slice(0, Math.max(survivalCount, 2));

    // Create new population through breeding
    const newPopulation = [];
    const populationSize = this.population.length;

    while (newPopulation.length < populationSize) {
      // Select two random parents from survivors
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

      // Crossover
      const childGenome = Genome.crossover(parent1.genome, parent2.genome);

      // Mutation
      childGenome.mutate(this.mutationRate);

      // Create new organism
      const x = Math.random() * this.environment.width;
      const y = Math.random() * this.environment.height;
      newPopulation.push(new Organism(x, y, childGenome));
    }

    this.population = newPopulation;
    this.generation++;

    // Reset food
    this.environment.food = [];
    this.environment.spawnFood(50);
  }

  recordStats() {
    const alive = this.population.filter(o => o.alive);
    const fitnesses = this.population.map(o => o.fitness);

    this.stats.avgFitness.push(
      fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length
    );
    this.stats.bestFitness.push(Math.max(...fitnesses));

    // Average traits
    if (alive.length > 0) {
      this.stats.avgSpeed.push(
        alive.reduce((sum, o) => sum + o.genome.genes.speed, 0) / alive.length
      );
      this.stats.avgVision.push(
        alive.reduce((sum, o) => sum + o.genome.genes.vision, 0) / alive.length
      );
      this.stats.avgSize.push(
        alive.reduce((sum, o) => sum + o.genome.genes.size, 0) / alive.length
      );
      this.stats.avgEfficiency.push(
        alive.reduce((sum, o) => sum + o.genome.genes.efficiency, 0) / alive.length
      );
      this.stats.avgAggression.push(
        alive.reduce((sum, o) => sum + o.genome.genes.aggression, 0) / alive.length
      );
      this.stats.avgDietType.push(
        alive.reduce((sum, o) => sum + o.genome.genes.dietType, 0) / alive.length
      );
      this.stats.avgMutationStability.push(
        alive.reduce((sum, o) => sum + o.genome.genes.mutationStability, 0) / alive.length
      );
    }
  }

  // User interventions
  cloneOrganism(organism) {
    const clone = organism.clone();
    this.population.push(clone);
  }

  mutateOrganism(organism, intensity = 0.3) {
    organism.genome.mutate(intensity);
  }

  eliminateOrganism(organism) {
    const index = this.population.indexOf(organism);
    if (index > -1) {
      this.population.splice(index, 1);
    }
  }

  // Gene editing with cost system
  editGene(organism, geneName, value) {
    if (!organism || !organism.alive) return false;

    // Resource cost based on change magnitude
    const oldValue = organism.genome.genes[geneName];
    const changeMagnitude = Math.abs(value - oldValue);

    // Editing has consequences - reduces stability temporarily
    organism.genome.genes[geneName] = value;
    organism.genome.genes.mutationStability *= 0.8; // Editing reduces stability

    return true;
  }

  triggerEvent(eventType) {
    switch (eventType) {
      case 'meteor':
        // Kill random 30% of population
        const killCount = Math.floor(this.population.length * 0.3);
        for (let i = 0; i < killCount; i++) {
          const randomIndex = Math.floor(Math.random() * this.population.length);
          this.population[randomIndex].alive = false;
        }
        break;

      case 'ice-age':
        // Increase energy costs
        for (let organism of this.population) {
          organism.genome.genes.efficiency *= 0.7;
        }
        break;

      case 'abundance':
        // Triple food
        this.environment.spawnFood(100);
        break;

      case 'plague':
        // Reduce energy of all organisms
        for (let organism of this.population) {
          organism.energy = Math.max(10, organism.energy * 0.5);
        }
        break;
    }
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  reset() {
    this.generation = 0;
    this.generationTimer = 0;
    this.stats = {
      avgFitness: [],
      bestFitness: [],
      avgSpeed: [],
      avgVision: [],
      avgSize: [],
      avgEfficiency: []
    };
    this.initializePopulation(this.population.length);
    this.environment.food = [];
    this.environment.spawnFood(50);
  }

  getAliveCount() {
    return this.population.filter(o => o.alive).length;
  }

  getStats() {
    const alive = this.population.filter(o => o.alive);

    return {
      population: alive.length,
      avgFitness: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.fitness, 0) / alive.length).toFixed(2)
        : '0.00',
      bestFitness: alive.length > 0
        ? Math.max(...alive.map(o => o.fitness)).toFixed(2)
        : '0.00',
      foodCount: this.environment.food.length,
      avgSpeed: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.speed, 0) / alive.length).toFixed(2)
        : '0.00',
      avgVision: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.vision, 0) / alive.length).toFixed(0)
        : '0',
      avgSize: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.size, 0) / alive.length).toFixed(2)
        : '0.00',
      avgEfficiency: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.efficiency, 0) / alive.length).toFixed(2)
        : '0.00',
      avgAggression: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.aggression, 0) / alive.length).toFixed(2)
        : '0.00',
      avgDietType: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.dietType, 0) / alive.length).toFixed(2)
        : '0.00',
      avgMutationStability: alive.length > 0
        ? (alive.reduce((sum, o) => sum + o.genome.genes.mutationStability, 0) / alive.length).toFixed(2)
        : '0.00',
      temperature: this.environment.temperature.toFixed(1),
      toxicity: this.environment.toxicity.toFixed(1)
    };
  }
}
