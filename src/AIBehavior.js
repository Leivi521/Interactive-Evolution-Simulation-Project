/**
 * AI BEHAVIOR SYSTEM
 *
 * Implements the 4-layer AI architecture:
 * - Layer 1: Instinct Layer (immediate survival)
 * - Layer 2: Behavioral Brain (utility-based decisions)
 * - Layer 3: Evolution Logic (generation intelligence)
 * - Layer 4: Ecosystem Intelligence
 */

// ============================================================================
// LAYER 1: INSTINCT LAYER
// ============================================================================

export class InstinctLayer {
  constructor(organism) {
    this.organism = organism;
  }

  /**
   * Fast, immediate survival reactions that always run
   */
  evaluateInstincts(environment) {
    const instincts = {
      criticalEnergy: this.checkCriticalEnergy(),
      immediateFood: this.checkImmediateFood(environment),
      immediateThreat: this.checkImmediateThreat(environment),
      exhaustion: this.checkExhaustion(),
      breeding: this.checkBreedingOpportunity(environment)
    };

    return instincts;
  }

  checkCriticalEnergy() {
    // Critical energy threshold based on organism efficiency
    const criticalThreshold = 20 * this.organism.genome.genes.efficiency;
    return {
      active: this.organism.energy < criticalThreshold,
      urgency: Math.max(0, 1 - this.organism.energy / criticalThreshold),
      action: 'seek_food_urgent'
    };
  }

  checkImmediateFood(environment) {
    // Check for food in immediate vicinity (collision range)
    const closeFood = environment.food.find(food =>
      this.organism.distance(food) < (this.organism.genome.genes.size + food.radius + 5)
    );

    return {
      active: closeFood !== undefined,
      target: closeFood,
      action: 'consume_food'
    };
  }

  checkImmediateThreat(environment) {
    // Check for threats in close proximity
    // For now, this checks for aggressive organisms nearby
    const visionRange = this.organism.genome.genes.vision * 0.3; // 30% of vision

    return {
      active: false, // Will be enhanced when predator/prey is added
      urgency: 0,
      action: 'flee'
    };
  }

  checkExhaustion() {
    // Stop moving when critically exhausted
    const exhaustionThreshold = 10;
    return {
      active: this.organism.energy < exhaustionThreshold,
      urgency: 1 - this.organism.energy / exhaustionThreshold,
      action: 'rest'
    };
  }

  checkBreedingOpportunity(environment) {
    // Check if conditions allow breeding
    const energyThreshold = 80;
    const hasEnergy = this.organism.energy > energyThreshold;

    return {
      active: hasEnergy && this.organism.age > 5,
      urgency: hasEnergy ? 0.3 : 0,
      action: 'seek_mate'
    };
  }
}

// ============================================================================
// LAYER 2: BEHAVIORAL BRAIN (Utility-Based Decision System)
// ============================================================================

export class BehavioralBrain {
  constructor(organism) {
    this.organism = organism;
    this.currentBehavior = null;
    this.behaviorTimer = 0;
    this.behaviorCommitment = 30; // Frames to commit to a behavior
  }

  /**
   * Utility-based AI: calculates priority scores for each behavior
   * and selects the highest priority action
   */
  evaluateBehaviors(environment, instincts, memory) {
    const behaviors = [];

    // Calculate utility for each behavior
    behaviors.push(this.evaluateFoodSeeking(environment, memory));
    behaviors.push(this.evaluateExploration(environment, memory));
    behaviors.push(this.evaluateEnergyConservation());
    behaviors.push(this.evaluateBreeding(environment));
    behaviors.push(this.evaluateTerritoryControl(environment));
    behaviors.push(this.evaluateSocialBehavior(environment));

    // Apply instinct overrides (instincts can boost priorities)
    if (instincts.criticalEnergy.active) {
      behaviors.find(b => b.name === 'food_seeking').priority *= 3;
    }

    if (instincts.exhaustion.active) {
      behaviors.find(b => b.name === 'energy_conservation').priority *= 5;
    }

    // Sort by priority
    behaviors.sort((a, b) => b.priority - a.priority);

    // Behavior commitment: don't switch too rapidly
    if (this.behaviorTimer > 0) {
      this.behaviorTimer--;
      return this.currentBehavior || behaviors[0];
    }

    // Select highest priority behavior
    this.currentBehavior = behaviors[0];
    this.behaviorTimer = this.behaviorCommitment;

    return this.currentBehavior;
  }

  evaluateFoodSeeking(environment, memory) {
    const energyFactor = Math.max(0, 1 - this.organism.energy / 100);
    const visionFactor = this.organism.genome.genes.vision / 150;

    // Find food within vision
    const visibleFood = environment.food.filter(food =>
      this.organism.distance(food) < this.organism.genome.genes.vision
    );

    const foodAvailability = visibleFood.length > 0 ? 1 : 0.3;

    // Trait-driven behavior: high efficiency organisms are more selective
    const efficiencyModifier = 2 - this.organism.genome.genes.efficiency;

    const priority = (energyFactor * 0.6 + foodAvailability * 0.4) *
                     visionFactor * efficiencyModifier;

    return {
      name: 'food_seeking',
      priority: priority,
      action: () => this.executeForaging(environment, memory),
      description: 'Seeking food sources'
    };
  }

  evaluateExploration(environment, memory) {
    const energyFactor = this.organism.energy / 100;
    const curiosityFactor = 1 - this.organism.genome.genes.efficiency; // Low efficiency = more movement

    // Exploration is higher when safe and energized
    const priority = energyFactor * curiosityFactor * 0.5;

    return {
      name: 'exploration',
      priority: priority,
      action: () => this.executeExploration(environment, memory),
      description: 'Exploring environment'
    };
  }

  evaluateEnergyConservation() {
    const lowEnergy = this.organism.energy < 30;
    const highEfficiency = this.organism.genome.genes.efficiency > 0.8;

    const priority = lowEnergy ? 0.8 : (highEfficiency ? 0.4 : 0.2);

    return {
      name: 'energy_conservation',
      priority: priority,
      action: () => this.executeResting(),
      description: 'Conserving energy'
    };
  }

  evaluateBreeding(environment) {
    const energyThreshold = 80;
    const hasEnergy = this.organism.energy > energyThreshold;
    const isOldEnough = this.organism.age > 5;

    const priority = (hasEnergy && isOldEnough) ? 0.4 : 0;

    return {
      name: 'breeding',
      priority: priority,
      action: () => this.executeBreeding(environment),
      description: 'Seeking breeding opportunity'
    };
  }

  evaluateTerritoryControl(environment) {
    // Territory control increases with population density
    const nearbyOrganisms = this.countNearbyOrganisms(environment);
    const crowdingFactor = Math.min(1, nearbyOrganisms / 10);

    const priority = crowdingFactor * 0.3;

    return {
      name: 'territory_control',
      priority: priority,
      action: () => this.executeTerritoryBehavior(environment),
      description: 'Controlling territory'
    };
  }

  evaluateSocialBehavior(environment) {
    // Social behavior based on nearby organisms
    const nearbyOrganisms = this.countNearbyOrganisms(environment);
    const socialFactor = Math.min(1, nearbyOrganisms / 5);

    const priority = socialFactor * 0.25;

    return {
      name: 'social_behavior',
      priority: priority,
      action: () => this.executeSocialBehavior(environment),
      description: 'Social interaction'
    };
  }

  // Behavior execution methods
  executeForaging(environment, memory) {
    const nearestFood = this.organism.findNearestFood(environment.food);

    if (nearestFood) {
      // Predictive pathfinding: anticipate food position
      const predictedPosition = this.predictFoodPosition(nearestFood);
      this.organism.target = predictedPosition;
      this.organism.moveTowards(predictedPosition);
    } else {
      // Search in areas not recently explored
      this.executeSmartSearch(memory);
    }
  }

  executeExploration(environment, memory) {
    // Intelligent exploration: avoid recently visited areas
    if (memory && memory.recentPositions.length > 0) {
      const avgRecentX = memory.recentPositions.reduce((sum, p) => sum + p.x, 0) / memory.recentPositions.length;
      const avgRecentY = memory.recentPositions.reduce((sum, p) => sum + p.y, 0) / memory.recentPositions.length;

      // Move away from recent average position
      const awayX = this.organism.x + (this.organism.x - avgRecentX) * 0.1;
      const awayY = this.organism.y + (this.organism.y - avgRecentY) * 0.1;

      this.organism.moveTowards({ x: awayX, y: awayY });
    } else {
      this.organism.randomWalk();
    }
  }

  executeResting() {
    // Minimal movement to conserve energy
    this.organism.velocity.x *= 0.5;
    this.organism.velocity.y *= 0.5;
  }

  executeBreeding(environment) {
    // This will be expanded when breeding mechanics are added
    this.organism.randomWalk();
  }

  executeTerritoryBehavior(environment) {
    // Move to less crowded areas
    const nearbyOrganisms = this.getNearbyOrganisms(environment);

    if (nearbyOrganisms.length > 0) {
      // Calculate center of nearby organisms
      const centerX = nearbyOrganisms.reduce((sum, org) => sum + org.x, 0) / nearbyOrganisms.length;
      const centerY = nearbyOrganisms.reduce((sum, org) => sum + org.y, 0) / nearbyOrganisms.length;

      // Move away from center
      const awayX = this.organism.x + (this.organism.x - centerX);
      const awayY = this.organism.y + (this.organism.y - centerY);

      this.organism.moveTowards({ x: awayX, y: awayY });
    }
  }

  executeSocialBehavior(environment) {
    // Simple flocking behavior: move toward nearby organisms
    const nearbyOrganisms = this.getNearbyOrganisms(environment);

    if (nearbyOrganisms.length > 0) {
      const centerX = nearbyOrganisms.reduce((sum, org) => sum + org.x, 0) / nearbyOrganisms.length;
      const centerY = nearbyOrganisms.reduce((sum, org) => sum + org.y, 0) / nearbyOrganisms.length;

      this.organism.moveTowards({ x: centerX, y: centerY });
    }
  }

  executeSmartSearch(memory) {
    // If memory indicates food-rich areas, search there
    if (memory && memory.foodDensityMap.size > 0) {
      // Find area with highest food density
      let bestArea = null;
      let bestDensity = 0;

      memory.foodDensityMap.forEach((density, key) => {
        if (density > bestDensity) {
          bestDensity = density;
          const [x, y] = key.split(',').map(Number);
          bestArea = { x, y };
        }
      });

      if (bestArea) {
        this.organism.moveTowards(bestArea);
        return;
      }
    }

    // Default: random walk
    this.organism.randomWalk();
  }

  predictFoodPosition(food) {
    // Food is stationary for now, but this can be extended
    return { x: food.x, y: food.y };
  }

  countNearbyOrganisms(environment) {
    if (!environment.organisms) return 0;

    const detectionRange = this.organism.genome.genes.vision * 0.5;
    return environment.organisms.filter(org =>
      org !== this.organism &&
      org.alive &&
      this.organism.distance(org) < detectionRange
    ).length;
  }

  getNearbyOrganisms(environment) {
    if (!environment.organisms) return [];

    const detectionRange = this.organism.genome.genes.vision * 0.5;
    return environment.organisms.filter(org =>
      org !== this.organism &&
      org.alive &&
      this.organism.distance(org) < detectionRange
    );
  }
}

// ============================================================================
// MEMORY SYSTEM
// ============================================================================

export class OrganismMemory {
  constructor() {
    this.recentPositions = [];
    this.dangerZones = [];
    this.foodDensityMap = new Map(); // Spatial memory of food-rich areas
    this.successfulPaths = [];
    this.maxMemorySize = 50;
  }

  recordPosition(x, y) {
    this.recentPositions.push({ x, y, timestamp: Date.now() });

    // Keep memory limited
    if (this.recentPositions.length > this.maxMemorySize) {
      this.recentPositions.shift();
    }
  }

  recordDangerZone(x, y, threat) {
    this.dangerZones.push({
      x,
      y,
      threat,
      timestamp: Date.now(),
      expiryTime: Date.now() + 10000 // 10 second memory
    });

    // Remove expired danger zones
    this.dangerZones = this.dangerZones.filter(zone =>
      Date.now() < zone.expiryTime
    );
  }

  recordFoodFound(x, y) {
    // Discretize space into grid cells for spatial memory
    const gridSize = 50;
    const gridX = Math.floor(x / gridSize) * gridSize;
    const gridY = Math.floor(y / gridSize) * gridSize;
    const key = `${gridX},${gridY}`;

    const currentDensity = this.foodDensityMap.get(key) || 0;
    this.foodDensityMap.set(key, currentDensity + 1);

    // Decay old memories
    if (this.foodDensityMap.size > 20) {
      const entries = Array.from(this.foodDensityMap.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.foodDensityMap = new Map(entries.slice(0, 20));
    }
  }

  isDangerousArea(x, y, threshold = 100) {
    return this.dangerZones.some(zone => {
      const distance = Math.sqrt((zone.x - x) ** 2 + (zone.y - y) ** 2);
      return distance < threshold;
    });
  }

  clear() {
    this.recentPositions = [];
    this.dangerZones = [];
    this.foodDensityMap.clear();
    this.successfulPaths = [];
  }
}

// ============================================================================
// PROXIMITY REASONING
// ============================================================================

export class ProximitySystem {
  constructor(organism) {
    this.organism = organism;
  }

  evaluateProximity(environment) {
    const visionRange = this.organism.genome.genes.vision;

    return {
      nearestResource: this.findNearestResource(environment, visionRange),
      nearestThreat: this.findNearestThreat(environment, visionRange),
      nearestAlly: this.findNearestAlly(environment, visionRange),
      nearestObstacle: this.findNearestObstacle(environment, visionRange),
      environmentalFactors: this.evaluateEnvironmentalFactors(environment)
    };
  }

  findNearestResource(environment, range) {
    const visibleFood = environment.food
      .filter(food => this.organism.distance(food) < range)
      .sort((a, b) => this.organism.distance(a) - this.organism.distance(b));

    return visibleFood[0] || null;
  }

  findNearestThreat(environment, range) {
    // Will be implemented when predator/prey mechanics are added
    return null;
  }

  findNearestAlly(environment, range) {
    if (!environment.organisms) return null;

    const nearbyOrganisms = environment.organisms
      .filter(org => org !== this.organism && org.alive)
      .filter(org => this.organism.distance(org) < range)
      .sort((a, b) => this.organism.distance(a) - this.organism.distance(b));

    return nearbyOrganisms[0] || null;
  }

  findNearestObstacle(environment, range) {
    // Check boundaries
    const distToLeft = this.organism.x;
    const distToRight = environment.width - this.organism.x;
    const distToTop = this.organism.y;
    const distToBottom = environment.height - this.organism.y;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist < range * 0.3) {
      return {
        type: 'boundary',
        distance: minDist,
        direction: this.getObstacleDirection(distToLeft, distToRight, distToTop, distToBottom)
      };
    }

    return null;
  }

  getObstacleDirection(left, right, top, bottom) {
    const min = Math.min(left, right, top, bottom);
    if (min === left) return 'left';
    if (min === right) return 'right';
    if (min === top) return 'top';
    return 'bottom';
  }

  evaluateEnvironmentalFactors(environment) {
    // Can be extended with heat zones, radiation, etc.
    return {
      foodDensity: environment.food.length / (environment.width * environment.height) * 10000,
      crowding: environment.organisms ? environment.organisms.filter(o => o.alive).length / 100 : 0
    };
  }
}

// ============================================================================
// THREAT PREDICTION
// ============================================================================

export class ThreatPredictor {
  constructor(organism) {
    this.organism = organism;
  }

  predictThreats(environment) {
    const threats = [];

    // Predict boundary collisions
    const boundaryThreat = this.predictBoundaryCollision(environment);
    if (boundaryThreat) threats.push(boundaryThreat);

    // Predict organism collisions
    const collisionThreats = this.predictOrganismCollisions(environment);
    threats.push(...collisionThreats);

    // Predict energy depletion
    const energyThreat = this.predictEnergyDepletion();
    if (energyThreat) threats.push(energyThreat);

    return threats;
  }

  predictBoundaryCollision(environment) {
    const lookAhead = 30; // frames to look ahead
    const futureX = this.organism.x + this.organism.velocity.x * lookAhead;
    const futureY = this.organism.y + this.organism.velocity.y * lookAhead;

    const margin = this.organism.genome.genes.size;

    if (futureX < margin || futureX > environment.width - margin ||
        futureY < margin || futureY > environment.height - margin) {
      return {
        type: 'boundary',
        severity: 0.6,
        timeToImpact: lookAhead,
        avoidanceVector: this.calculateBoundaryAvoidance(environment)
      };
    }

    return null;
  }

  predictOrganismCollisions(environment) {
    if (!environment.organisms) return [];

    const threats = [];
    const lookAhead = 20;

    environment.organisms.forEach(other => {
      if (other === this.organism || !other.alive) return;

      const futureX = this.organism.x + this.organism.velocity.x * lookAhead;
      const futureY = this.organism.y + this.organism.velocity.y * lookAhead;
      const otherFutureX = other.x + other.velocity.x * lookAhead;
      const otherFutureY = other.y + other.velocity.y * lookAhead;

      const futureDistance = Math.sqrt(
        (futureX - otherFutureX) ** 2 + (futureY - otherFutureY) ** 2
      );

      const collisionRadius = this.organism.genome.genes.size + other.genome.genes.size + 10;

      if (futureDistance < collisionRadius) {
        threats.push({
          type: 'organism_collision',
          severity: 0.4,
          timeToImpact: lookAhead,
          target: other,
          avoidanceVector: this.calculateAvoidanceVector(other)
        });
      }
    });

    return threats;
  }

  predictEnergyDepletion() {
    const energyPerFrame = this.organism.genome.genes.size *
                           this.organism.genome.genes.speed *
                           this.organism.genome.genes.efficiency * 0.05;

    const framesUntilDeath = this.organism.energy / energyPerFrame;

    if (framesUntilDeath < 100) {
      return {
        type: 'energy_depletion',
        severity: 1 - (framesUntilDeath / 100),
        timeToImpact: framesUntilDeath,
        avoidanceVector: null
      };
    }

    return null;
  }

  calculateBoundaryAvoidance(environment) {
    const margin = 50;
    let avoidX = 0;
    let avoidY = 0;

    if (this.organism.x < margin) avoidX = 1;
    if (this.organism.x > environment.width - margin) avoidX = -1;
    if (this.organism.y < margin) avoidY = 1;
    if (this.organism.y > environment.height - margin) avoidY = -1;

    return { x: avoidX, y: avoidY };
  }

  calculateAvoidanceVector(other) {
    const dx = this.organism.x - other.x;
    const dy = this.organism.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { x: 0, y: 0 };

    return {
      x: dx / distance,
      y: dy / distance
    };
  }
}

// ============================================================================
// RESOURCE FORECASTING
// ============================================================================

export class ResourceForecaster {
  constructor(organism) {
    this.organism = organism;
  }

  forecastResourceNeeds(environment) {
    const currentEnergy = this.organism.energy;
    const energyCostPerFrame = this.calculateEnergyCost();
    const foodInVision = this.countFoodInVision(environment);

    return {
      survivalTime: currentEnergy / energyCostPerFrame,
      foodDensity: foodInVision / (Math.PI * this.organism.genome.genes.vision ** 2),
      optimalFeedingPath: this.calculateOptimalPath(environment),
      energyEfficiencyScore: this.calculateEfficiencyScore()
    };
  }

  calculateEnergyCost() {
    return this.organism.genome.genes.size *
           this.organism.genome.genes.speed *
           this.organism.genome.genes.efficiency * 0.05;
  }

  countFoodInVision(environment) {
    const visionRange = this.organism.genome.genes.vision;
    return environment.food.filter(food =>
      this.organism.distance(food) < visionRange
    ).length;
  }

  calculateOptimalPath(environment) {
    const visibleFood = environment.food.filter(food =>
      this.organism.distance(food) < this.organism.genome.genes.vision
    );

    if (visibleFood.length === 0) return null;

    // Simple greedy algorithm: choose closest food with best energy/distance ratio
    const foodWithScore = visibleFood.map(food => {
      const distance = this.organism.distance(food);
      const energyCost = distance * this.calculateEnergyCost();
      const netGain = food.energy - energyCost;

      return {
        food,
        distance,
        netGain,
        score: netGain / distance
      };
    });

    foodWithScore.sort((a, b) => b.score - a.score);

    return foodWithScore[0]?.food || null;
  }

  calculateEfficiencyScore() {
    const speed = this.organism.genome.genes.speed;
    const efficiency = this.organism.genome.genes.efficiency;
    const size = this.organism.genome.genes.size;

    // Higher score = better energy efficiency
    return efficiency / (size * speed);
  }
}
