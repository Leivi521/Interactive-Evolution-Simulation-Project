/**
 * EVOLUTION INTELLIGENCE SYSTEM
 *
 * Implements Layer 3 (Evolution Logic) and Layer 4 (Ecosystem Intelligence)
 * These systems create population-level and ecosystem-level intelligence
 */

// ============================================================================
// LAYER 3: EVOLUTION LOGIC (Generation-to-Generation Intelligence)
// ============================================================================

export class EvolutionIntelligence {
  constructor() {
    this.generationHistory = [];
    this.environmentalPressures = {
      predation: 0,
      starvation: 0,
      competition: 0,
      instability: 0
    };

    this.traitSuccessRates = {
      speed: [],
      vision: [],
      size: [],
      efficiency: []
    };

    this.adaptiveWeights = {
      speed: 1.0,
      vision: 1.0,
      size: 1.0,
      efficiency: 1.0
    };
  }

  /**
   * Analyzes generation performance and adjusts evolution strategy
   */
  analyzeGeneration(population, environment) {
    const alive = population.filter(p => p.alive);
    const dead = population.filter(p => !p.alive);

    // Calculate survival statistics
    const stats = {
      survivalRate: alive.length / population.length,
      avgFitness: this.calculateAverage(alive, org => org.fitness),
      avgEnergy: this.calculateAverage(alive, org => org.energy),
      avgAge: this.calculateAverage(alive, org => org.age),
      traitDistributions: this.analyzeTraitDistributions(alive, dead),
      deathCauses: this.analyzeDeathCauses(dead),
      resourceEfficiency: this.calculateResourceEfficiency(alive, environment)
    };

    this.generationHistory.push(stats);

    // Adjust evolutionary pressures based on outcomes
    this.updateEnvironmentalPressures(stats);

    // Adjust trait weights based on success
    this.updateTraitWeights(stats);

    return stats;
  }

  /**
   * Calculate which traits correlate with survival
   */
  analyzeTraitDistributions(survivors, casualties) {
    const analysis = {
      speed: this.compareTraitSuccess(survivors, casualties, 'speed'),
      vision: this.compareTraitSuccess(survivors, casualties, 'vision'),
      size: this.compareTraitSuccess(survivors, casualties, 'size'),
      efficiency: this.compareTraitSuccess(survivors, casualties, 'efficiency')
    };

    return analysis;
  }

  compareTraitSuccess(survivors, casualties, trait) {
    const survivorAvg = survivors.length > 0
      ? survivors.reduce((sum, org) => sum + org.genome.genes[trait], 0) / survivors.length
      : 0;

    const casualtyAvg = casualties.length > 0
      ? casualties.reduce((sum, org) => sum + org.genome.genes[trait], 0) / casualties.length
      : 0;

    const advantage = survivorAvg - casualtyAvg;
    const correlation = advantage / (survivorAvg + casualtyAvg || 1);

    return {
      survivorAvg,
      casualtyAvg,
      advantage,
      correlation
    };
  }

  analyzeDeathCauses(casualties) {
    const causes = {
      starvation: 0,
      exhaustion: 0,
      inefficiency: 0,
      unknown: 0
    };

    casualties.forEach(org => {
      if (org.energy <= 0) {
        if (org.foodCollected < 3) {
          causes.starvation++;
        } else {
          causes.exhaustion++;
        }
      } else if (org.genome.genes.efficiency < 0.5) {
        causes.inefficiency++;
      } else {
        causes.unknown++;
      }
    });

    return causes;
  }

  calculateResourceEfficiency(population, environment) {
    if (population.length === 0) return 0;

    const totalFood = population.reduce((sum, org) => sum + org.foodCollected, 0);
    const totalEnergy = population.reduce((sum, org) => sum + org.energy, 0);

    return (totalFood * 20 + totalEnergy) / population.length;
  }

  updateEnvironmentalPressures(stats) {
    // High starvation deaths → increase food pressure
    if (stats.deathCauses.starvation > stats.deathCauses.exhaustion) {
      this.environmentalPressures.starvation += 0.1;
    } else {
      this.environmentalPressures.starvation = Math.max(0, this.environmentalPressures.starvation - 0.05);
    }

    // Low survival rate → increase competition pressure
    if (stats.survivalRate < 0.3) {
      this.environmentalPressures.competition += 0.1;
    }

    // High variance in traits → instability
    const traitVariance = Object.values(stats.traitDistributions)
      .reduce((sum, dist) => sum + Math.abs(dist.correlation), 0) / 4;

    this.environmentalPressures.instability = traitVariance;
  }

  updateTraitWeights(stats) {
    // Boost weights for traits that correlate with survival
    for (const [trait, distribution] of Object.entries(stats.traitDistributions)) {
      const correlation = distribution.correlation;

      if (correlation > 0.1) {
        // Trait positively correlates with survival
        this.adaptiveWeights[trait] = Math.min(2.0, this.adaptiveWeights[trait] + 0.05);
      } else if (correlation < -0.1) {
        // Trait negatively correlates with survival
        this.adaptiveWeights[trait] = Math.max(0.5, this.adaptiveWeights[trait] - 0.05);
      }

      // Record success rate
      this.traitSuccessRates[trait].push(correlation);
      if (this.traitSuccessRates[trait].length > 20) {
        this.traitSuccessRates[trait].shift();
      }
    }
  }

  /**
   * Apply intelligent parent selection based on environmental pressures
   */
  selectParents(population, selectionPressure) {
    // Calculate weighted fitness based on current environmental pressures
    const weightedPopulation = population.map(org => {
      let weightedFitness = org.fitness;

      // Apply trait weights
      weightedFitness += org.genome.genes.speed * this.adaptiveWeights.speed * 2;
      weightedFitness += org.genome.genes.vision * this.adaptiveWeights.vision * 0.1;
      weightedFitness += org.genome.genes.size * this.adaptiveWeights.size * 0.5;
      weightedFitness += org.genome.genes.efficiency * this.adaptiveWeights.efficiency * 10;

      // Apply environmental pressure modifiers
      if (this.environmentalPressures.starvation > 0.5) {
        // Favor efficient organisms during starvation
        weightedFitness += org.genome.genes.efficiency * 20;
        weightedFitness += org.genome.genes.vision * 0.2;
      }

      if (this.environmentalPressures.competition > 0.5) {
        // Favor fast, large organisms during competition
        weightedFitness += org.genome.genes.speed * 3;
        weightedFitness += org.genome.genes.size;
      }

      return { organism: org, weightedFitness };
    });

    // Sort by weighted fitness
    weightedPopulation.sort((a, b) => b.weightedFitness - a.weightedFitness);

    // Select top performers
    const survivalCount = Math.floor(population.length * selectionPressure);
    const survivors = weightedPopulation
      .slice(0, Math.max(survivalCount, 2))
      .map(entry => entry.organism);

    return survivors;
  }

  /**
   * Adjust mutation distribution based on environment
   */
  getAdaptiveMutationRate(baseRate) {
    // Increase mutation during high instability
    const instabilityFactor = 1 + this.environmentalPressures.instability * 0.5;

    // Decrease mutation when population is stable and successful
    const recentSuccess = this.generationHistory.slice(-5);
    if (recentSuccess.length >= 5) {
      const avgSurvival = recentSuccess.reduce((sum, gen) => sum + gen.survivalRate, 0) / 5;
      if (avgSurvival > 0.7) {
        return baseRate * 0.7 * instabilityFactor; // Reduce mutation in successful populations
      }
    }

    return baseRate * instabilityFactor;
  }

  /**
   * Trait-targeted mutation: mutate traits that need improvement
   */
  intelligentMutation(genome, mutationRate) {
    const mutate = (value, range, min, weight) => {
      if (Math.random() < mutationRate * weight) {
        const change = (Math.random() - 0.5) * range * 0.3;
        return Math.max(min, value + change);
      }
      return value;
    };

    // Apply trait-specific mutation rates based on adaptive weights
    genome.genes.speed = mutate(
      genome.genes.speed,
      5,
      0.5,
      this.adaptiveWeights.speed
    );

    genome.genes.vision = mutate(
      genome.genes.vision,
      100,
      30,
      this.adaptiveWeights.vision
    );

    genome.genes.size = mutate(
      genome.genes.size,
      15,
      3,
      this.adaptiveWeights.size
    );

    genome.genes.efficiency = mutate(
      genome.genes.efficiency,
      0.5,
      0.3,
      this.adaptiveWeights.efficiency
    );

    // Mutate color slightly
    if (Math.random() < mutationRate) {
      genome.color.h = (genome.color.h + (Math.random() - 0.5) * 60) % 360;
    }
  }

  calculateAverage(array, accessor) {
    if (array.length === 0) return 0;
    return array.reduce((sum, item) => sum + accessor(item), 0) / array.length;
  }
}

// ============================================================================
// LAYER 4: ECOSYSTEM INTELLIGENCE
// ============================================================================

export class EcosystemIntelligence {
  constructor() {
    this.populationTrends = [];
    this.resourceConsumption = [];
    this.diversityIndex = [];
    this.stabilityScore = [];

    this.ecosystemState = {
      phase: 'growth', // growth, stable, decline, crisis
      pressure: 'low', // low, medium, high
      diversity: 'high' // low, medium, high
    };
  }

  /**
   * Analyze ecosystem-level patterns and intelligence
   */
  analyzeEcosystem(population, environment, generation) {
    const alive = population.filter(p => p.alive);

    const analysis = {
      populationSize: alive.length,
      populationDensity: alive.length / (environment.width * environment.height) * 10000,
      resourceRatio: environment.food.length / Math.max(alive.length, 1),
      diversity: this.calculateDiversity(alive),
      stability: this.calculateStability(),
      dominantTraits: this.identifyDominantTraits(alive),
      emergentBehaviors: this.detectEmergentBehaviors(alive),
      generation
    };

    // Update trends
    this.populationTrends.push(analysis.populationSize);
    this.diversityIndex.push(analysis.diversity);
    this.stabilityScore.push(analysis.stability);

    // Limit history
    if (this.populationTrends.length > 50) {
      this.populationTrends.shift();
      this.diversityIndex.shift();
      this.stabilityScore.shift();
    }

    // Update ecosystem state
    this.updateEcosystemState(analysis);

    return analysis;
  }

  calculateDiversity(population) {
    if (population.length === 0) return 0;

    // Calculate trait variance as diversity metric
    const traits = ['speed', 'vision', 'size', 'efficiency'];
    let totalVariance = 0;

    traits.forEach(trait => {
      const values = population.map(org => org.genome.genes[trait]);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
      totalVariance += variance;
    });

    return totalVariance / traits.length;
  }

  calculateStability() {
    if (this.populationTrends.length < 5) return 0;

    // Calculate population variance over recent history
    const recentPop = this.populationTrends.slice(-10);
    const avg = recentPop.reduce((sum, p) => sum + p, 0) / recentPop.length;
    const variance = recentPop.reduce((sum, p) => sum + (p - avg) ** 2, 0) / recentPop.length;

    // Lower variance = higher stability
    return Math.max(0, 1 - (variance / (avg * avg || 1)));
  }

  identifyDominantTraits(population) {
    if (population.length === 0) return null;

    const traits = {
      speed: 0,
      vision: 0,
      size: 0,
      efficiency: 0
    };

    population.forEach(org => {
      traits.speed += org.genome.genes.speed;
      traits.vision += org.genome.genes.vision;
      traits.size += org.genome.genes.size;
      traits.efficiency += org.genome.genes.efficiency;
    });

    Object.keys(traits).forEach(key => {
      traits[key] /= population.length;
    });

    // Identify which traits are above/below baseline
    return {
      highSpeed: traits.speed > 4,
      highVision: traits.vision > 100,
      largeSize: traits.size > 12,
      highEfficiency: traits.efficiency > 0.75,
      avgTraits: traits
    };
  }

  detectEmergentBehaviors(population) {
    // Detect population-level behaviors
    const behaviors = {
      clustering: this.detectClustering(population),
      migration: this.detectMigration(population),
      specialization: this.detectSpecialization(population)
    };

    return behaviors;
  }

  detectClustering(population) {
    if (population.length < 5) return false;

    // Check if organisms are clustered together
    const centerX = population.reduce((sum, org) => sum + org.x, 0) / population.length;
    const centerY = population.reduce((sum, org) => sum + org.y, 0) / population.length;

    const avgDistance = population.reduce((sum, org) => {
      const dx = org.x - centerX;
      const dy = org.y - centerY;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0) / population.length;

    // If average distance from center is low, clustering is high
    return avgDistance < 200;
  }

  detectMigration(population) {
    // Check if population center is moving
    if (this.populationTrends.length < 3) return false;

    // Simple heuristic: rapid population changes indicate migration
    const recent = this.populationTrends.slice(-3);
    const variance = recent.reduce((sum, p, i) => {
      if (i === 0) return 0;
      return sum + Math.abs(p - recent[i - 1]);
    }, 0);

    return variance > 10;
  }

  detectSpecialization(population) {
    // Check if distinct sub-populations have emerged
    if (population.length < 10) return false;

    // Detect if there are distinct clusters of trait values
    const speedValues = population.map(org => org.genome.genes.speed);
    const speedVariance = this.calculateVariance(speedValues);

    return speedVariance > 2; // High variance indicates specialization
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  }

  updateEcosystemState(analysis) {
    // Determine ecosystem phase
    if (this.populationTrends.length >= 3) {
      const recent = this.populationTrends.slice(-3);
      const trend = recent[2] - recent[0];

      if (trend > 5) {
        this.ecosystemState.phase = 'growth';
      } else if (trend < -5) {
        this.ecosystemState.phase = 'decline';
      } else if (analysis.populationSize < 5) {
        this.ecosystemState.phase = 'crisis';
      } else {
        this.ecosystemState.phase = 'stable';
      }
    }

    // Determine pressure level
    if (analysis.resourceRatio < 1) {
      this.ecosystemState.pressure = 'high';
    } else if (analysis.resourceRatio < 2) {
      this.ecosystemState.pressure = 'medium';
    } else {
      this.ecosystemState.pressure = 'low';
    }

    // Determine diversity level
    if (analysis.diversity < 5) {
      this.ecosystemState.diversity = 'low';
    } else if (analysis.diversity < 15) {
      this.ecosystemState.diversity = 'medium';
    } else {
      this.ecosystemState.diversity = 'high';
    }
  }

  /**
   * Recommend ecosystem-level interventions
   */
  recommendInterventions() {
    const recommendations = [];

    if (this.ecosystemState.phase === 'crisis') {
      recommendations.push({
        type: 'abundance',
        reason: 'Population in crisis - need more resources',
        urgency: 'high'
      });
    }

    if (this.ecosystemState.diversity === 'low') {
      recommendations.push({
        type: 'increase_mutation',
        reason: 'Low diversity - need more genetic variation',
        urgency: 'medium'
      });
    }

    if (this.ecosystemState.pressure === 'high') {
      recommendations.push({
        type: 'reduce_selection_pressure',
        reason: 'High competition - allow more survivors',
        urgency: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get ecosystem intelligence summary
   */
  getIntelligenceSummary() {
    return {
      state: this.ecosystemState,
      trends: {
        population: this.getTrend(this.populationTrends),
        diversity: this.getTrend(this.diversityIndex),
        stability: this.getTrend(this.stabilityScore)
      },
      recommendations: this.recommendInterventions()
    };
  }

  getTrend(data) {
    if (data.length < 5) return 'insufficient_data';

    const recent = data.slice(-5);
    const trend = recent[4] - recent[0];

    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }
}

// ============================================================================
// PLAYER INTERACTION INTELLIGENCE
// ============================================================================

export class PlayerInteractionIntelligence {
  constructor() {
    this.interventionHistory = [];
    this.responsePatterns = {};
  }

  /**
   * Track player interventions and adapt ecosystem accordingly
   */
  recordIntervention(interventionType, ecosystemState) {
    this.interventionHistory.push({
      type: interventionType,
      timestamp: Date.now(),
      ecosystemState: { ...ecosystemState }
    });

    // Limit history
    if (this.interventionHistory.length > 50) {
      this.interventionHistory.shift();
    }
  }

  /**
   * Analyze how ecosystem should respond to player actions
   */
  generateResponse(interventionType, population, environment) {
    const response = {
      traitShifts: {},
      behavioralChanges: {},
      populationEffects: {}
    };

    switch (interventionType) {
      case 'increased_mutation':
        response.traitShifts = {
          diversity: 'increase',
          stability: 'decrease'
        };
        response.behavioralChanges = {
          exploration: 'increase',
          riskTaking: 'increase'
        };
        break;

      case 'spawned_predators':
        response.traitShifts = {
          speed: 'increase',
          vision: 'increase',
          efficiency: 'decrease'
        };
        response.behavioralChanges = {
          aggression: 'decrease',
          flocking: 'increase',
          caution: 'increase'
        };
        break;

      case 'meteor':
        response.traitShifts = {
          resilience: 'increase',
          reproduction: 'increase'
        };
        response.behavioralChanges = {
          dispersal: 'increase',
          resourceHoarding: 'increase'
        };
        break;

      case 'abundance':
        response.traitShifts = {
          size: 'increase',
          efficiency: 'decrease'
        };
        response.behavioralChanges = {
          competition: 'decrease',
          exploration: 'increase'
        };
        break;
    }

    this.responsePatterns[interventionType] = response;
    return response;
  }

  /**
   * Apply adaptive responses to population
   */
  applyAdaptiveResponse(population, response) {
    // This creates the illusion that the AI is responding to player strategy
    // In reality, we're just adjusting parameters based on intervention type

    population.forEach(organism => {
      if (!organism.alive) return;

      // Apply behavioral changes
      if (response.behavioralChanges.riskTaking === 'increase') {
        organism.behavioralBrain.behaviorCommitment -= 5;
      }

      if (response.behavioralChanges.exploration === 'increase') {
        organism.behavioralBrain.evaluateExploration = function() {
          return { priority: 0.7 }; // Boost exploration priority
        };
      }
    });

    return population;
  }
}
