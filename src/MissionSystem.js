/**
 * MISSION SYSTEM
 * Defines structured challenges and progression for the game
 */

// ============================================
// MISSION CLASS
// ============================================
export class Mission {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.duration = config.duration || 120; // seconds
    this.objectives = config.objectives || [];
    this.constraints = config.constraints || {};
    this.unlocked = config.unlocked || false;
    this.completed = false;
    this.stars = 0; // 0-3 star rating
  }

  // Check if mission objectives are met
  checkObjectives(simulation) {
    const results = this.objectives.map(obj => {
      return {
        ...obj,
        completed: obj.check(simulation)
      };
    });

    // Mission is complete if all objectives are met
    const allComplete = results.every(r => r.completed);
    if (allComplete && !this.completed) {
      this.completed = true;
      this.calculateStars(simulation);
    }

    return results;
  }

  calculateStars(simulation) {
    // Calculate stars based on performance
    const gen = simulation.generation;
    const efficiency = simulation.stats.avgEfficiency[simulation.stats.avgEfficiency.length - 1] || 0;

    if (gen <= this.duration * 0.5 && efficiency > 0.8) {
      this.stars = 3;
    } else if (gen <= this.duration * 0.75 && efficiency > 0.6) {
      this.stars = 2;
    } else {
      this.stars = 1;
    }
  }

  applyConstraints(simulation) {
    // Apply mission-specific constraints to simulation
    if (this.constraints.mutationRate !== undefined) {
      simulation.mutationRate = this.constraints.mutationRate;
    }
    if (this.constraints.populationSize !== undefined) {
      // Limit population size
      while (simulation.population.length > this.constraints.populationSize) {
        simulation.population.pop();
      }
    }
    if (this.constraints.temperature !== undefined) {
      simulation.environment.temperature = this.constraints.temperature;
    }
    if (this.constraints.foodAbundance !== undefined) {
      simulation.environment.foodAbundance = this.constraints.foodAbundance;
    }
  }
}

// ============================================
// MISSION DEFINITIONS
// ============================================

export const MISSIONS = [
  // Mission 1: Genesis
  {
    id: 'genesis',
    name: 'Genesis',
    description: 'Evolve the first generation to survive a simple food-sparse environment. Survive 10 generations without going extinct.',
    duration: 180, // seconds
    unlocked: true,
    objectives: [
      {
        id: 'survive_10_gen',
        description: 'Survive 10 generations',
        check: (sim) => sim.generation >= 10
      },
      {
        id: 'maintain_population',
        description: 'Keep at least 5 organisms alive',
        check: (sim) => sim.getAliveCount() >= 5
      }
    ],
    constraints: {
      foodAbundance: 30,
      populationSize: 20
    },
    tutorial: 'Learn the basics: organisms seek food, reproduce, and mutate. Watch as evolution naturally selects the fittest.'
  },

  // Mission 2: Selective Pressure
  {
    id: 'selective_pressure',
    name: 'Selective Pressure',
    description: 'Increase average speed by 20% over 6 generations through controlled breeding.',
    duration: 150,
    unlocked: false,
    objectives: [
      {
        id: 'increase_speed',
        description: 'Increase average speed by 20%',
        check: (sim) => {
          if (sim.stats.avgSpeed.length < 2) return false;
          const initial = sim.stats.avgSpeed[0];
          const current = sim.stats.avgSpeed[sim.stats.avgSpeed.length - 1];
          return current >= initial * 1.2;
        }
      },
      {
        id: 'within_generations',
        description: 'Complete within 6 generations',
        check: (sim) => sim.generation <= 6
      }
    ],
    constraints: {
      foodAbundance: 50
    },
    tutorial: 'Use selective breeding to emphasize specific traits. Be careful - focusing too much on speed may reduce efficiency!'
  },

  // Mission 3: Environmental Shock
  {
    id: 'environmental_shock',
    name: 'Environmental Shock',
    description: 'Survive a sudden climate shift with temperature extremes.',
    duration: 200,
    unlocked: false,
    objectives: [
      {
        id: 'survive_heat',
        description: 'Survive temperature changes',
        check: (sim) => sim.generation >= 8 && sim.getAliveCount() >= 10
      },
      {
        id: 'adapt_efficiency',
        description: 'Maintain average efficiency above 0.6',
        check: (sim) => {
          if (sim.stats.avgEfficiency.length === 0) return false;
          const current = sim.stats.avgEfficiency[sim.stats.avgEfficiency.length - 1];
          return current >= 0.6;
        }
      }
    ],
    constraints: {
      temperature: 35, // Hot start
      foodAbundance: 40
    },
    tutorial: 'Environmental changes stress organisms. Efficiency becomes critical for survival in harsh conditions.'
  },

  // Mission 4: Predator Cells
  {
    id: 'predator_cells',
    name: 'Predator Cells',
    description: 'Introduce predators and evolve defenses quickly enough to survive.',
    duration: 180,
    unlocked: false,
    objectives: [
      {
        id: 'evolve_defenses',
        description: 'Evolve high vision or speed (avg > 100 vision OR avg > 4 speed)',
        check: (sim) => {
          if (sim.stats.avgVision.length === 0 || sim.stats.avgSpeed.length === 0) return false;
          const vision = sim.stats.avgVision[sim.stats.avgVision.length - 1];
          const speed = sim.stats.avgSpeed[sim.stats.avgSpeed.length - 1];
          return vision > 100 || speed > 4;
        }
      },
      {
        id: 'survive_predators',
        description: 'Survive 10 generations with predators',
        check: (sim) => sim.generation >= 10 && sim.getAliveCount() >= 8
      }
    ],
    constraints: {
      foodAbundance: 60
    },
    tutorial: 'Predators hunt smaller, slower organisms. Evolve vision to see them coming or speed to escape!',
    specialSetup: (sim) => {
      // Add predatory organisms
      for (let i = 0; i < 5; i++) {
        const predator = sim.population[i];
        if (predator) {
          predator.genome.genes.aggression = 8;
          predator.genome.genes.dietType = 0.9; // Carnivore
          predator.genome.genes.size = 18;
        }
      }
    }
  },

  // Mission 5: Efficiency Crisis
  {
    id: 'efficiency_crisis',
    name: 'Efficiency Crisis',
    description: 'Evolve creatures that consume 30% less energy.',
    duration: 150,
    unlocked: false,
    objectives: [
      {
        id: 'high_efficiency',
        description: 'Achieve average efficiency above 0.8',
        check: (sim) => {
          if (sim.stats.avgEfficiency.length === 0) return false;
          const current = sim.stats.avgEfficiency[sim.stats.avgEfficiency.length - 1];
          return current >= 0.8;
        }
      },
      {
        id: 'avoid_extinction',
        description: 'Maintain population above 15',
        check: (sim) => sim.getAliveCount() >= 15
      }
    ],
    constraints: {
      foodAbundance: 25, // Very scarce food
    },
    tutorial: 'Scarce resources demand efficiency. But efficient organisms are often slower - balance is key!'
  },

  // Mission 6: Gene Sculpting
  {
    id: 'gene_sculpting',
    name: 'Gene Sculpting',
    description: 'Use direct gene editing to create a specialized creature.',
    duration: 120,
    unlocked: false,
    objectives: [
      {
        id: 'use_gene_editing',
        description: 'Successfully edit genes to create a specialist',
        check: (sim) => {
          // Check if any organism has extreme trait values (indicating editing)
          return sim.population.some(org =>
            org.alive && (
              org.genome.genes.speed > 7 ||
              org.genome.genes.vision > 150 ||
              org.genome.genes.efficiency > 0.9
            )
          );
        }
      },
      {
        id: 'maintain_stability',
        description: 'Keep edited lineage alive for 5 generations',
        check: (sim) => sim.generation >= 5 && sim.getAliveCount() >= 10
      }
    ],
    constraints: {
      mutationRate: 0.15, // High mutation can destabilize edited genes
      foodAbundance: 50
    },
    tutorial: 'Gene editing is powerful but risky. Edited traits may be lost if mutation rate is too high!'
  },

  // Mission 7: Symbiosis
  {
    id: 'symbiosis',
    name: 'Symbiosis',
    description: 'Maintain two distinct species with different roles (herbivores and scavengers).',
    duration: 200,
    unlocked: false,
    objectives: [
      {
        id: 'species_diversity',
        description: 'Maintain organisms with diverse diet types (herbivores AND omnivores)',
        check: (sim) => {
          const alive = sim.population.filter(o => o.alive);
          const herbivores = alive.filter(o => o.genome.genes.dietType < 0.3).length;
          const omnivores = alive.filter(o => o.genome.genes.dietType >= 0.3 && o.genome.genes.dietType < 0.7).length;
          return herbivores >= 5 && omnivores >= 5;
        }
      },
      {
        id: 'long_term',
        description: 'Maintain diversity for 10 generations',
        check: (sim) => sim.generation >= 10
      }
    ],
    constraints: {
      foodAbundance: 45
    },
    tutorial: 'Managing multiple species is challenging. They must coexist without one dominating completely.'
  },

  // Mission 8: Catastrophe Event
  {
    id: 'catastrophe',
    name: 'Catastrophe Event',
    description: 'Survive a meteor strike that kills 80% of the population.',
    duration: 180,
    unlocked: false,
    objectives: [
      {
        id: 'recover_population',
        description: 'Rebuild population to 20+ after catastrophe',
        check: (sim) => sim.generation >= 8 && sim.getAliveCount() >= 20
      },
      {
        id: 'genetic_diversity',
        description: 'Maintain genetic diversity (avg mutation stability > 0.5)',
        check: (sim) => {
          if (sim.stats.avgMutationStability.length === 0) return false;
          const current = sim.stats.avgMutationStability[sim.stats.avgMutationStability.length - 1];
          return current >= 0.5;
        }
      }
    ],
    constraints: {
      foodAbundance: 50
    },
    tutorial: 'Bottleneck effects reduce diversity. Recovery depends on the survivors\' genetic variety.',
    specialSetup: (sim) => {
      // Trigger meteor at generation 3
      setTimeout(() => {
        if (sim.generation >= 3) {
          sim.triggerEvent('meteor');
          sim.triggerEvent('meteor'); // Double hit for 80% reduction
        }
      }, 30000); // After 30 seconds
    }
  },

  // Mission 9: Arms Race
  {
    id: 'arms_race',
    name: 'Arms Race',
    description: 'Out-evolve a procedurally mutating enemy species.',
    duration: 200,
    unlocked: false,
    objectives: [
      {
        id: 'outcompete',
        description: 'Achieve higher average fitness than initial baseline',
        check: (sim) => {
          if (sim.stats.avgFitness.length < 2) return false;
          const initial = sim.stats.avgFitness[0];
          const current = sim.stats.avgFitness[sim.stats.avgFitness.length - 1];
          return current > initial * 1.5;
        }
      },
      {
        id: 'survive_competition',
        description: 'Maintain population above 15 for 12 generations',
        check: (sim) => sim.generation >= 12 && sim.getAliveCount() >= 15
      }
    ],
    constraints: {
      mutationRate: 0.2, // High mutation for both species
      foodAbundance: 40
    },
    tutorial: 'Both your species and the enemy evolve simultaneously. Adapt faster to survive!'
  },

  // Mission 10: Final Evolution
  {
    id: 'final_evolution',
    name: 'Final Evolution',
    description: 'Evolve an advanced species with 3 high-value traits simultaneously.',
    duration: 240,
    unlocked: false,
    objectives: [
      {
        id: 'triple_excellence',
        description: 'Achieve high speed (>5), vision (>120), AND efficiency (>0.75)',
        check: (sim) => {
          if (sim.stats.avgSpeed.length === 0) return false;
          const speed = sim.stats.avgSpeed[sim.stats.avgSpeed.length - 1];
          const vision = sim.stats.avgVision[sim.stats.avgVision.length - 1];
          const efficiency = sim.stats.avgEfficiency[sim.stats.avgEfficiency.length - 1];
          return speed > 5 && vision > 120 && efficiency > 0.75;
        }
      },
      {
        id: 'sustained_excellence',
        description: 'Maintain excellence for 5 generations',
        check: (sim) => {
          if (sim.generation < 5) return false;
          // Check last 5 generations
          const recent = sim.stats.avgSpeed.slice(-5);
          return recent.length === 5 && recent.every(s => s > 5);
        }
      },
      {
        id: 'large_population',
        description: 'Maintain population above 25',
        check: (sim) => sim.getAliveCount() >= 25
      }
    ],
    constraints: {
      foodAbundance: 45
    },
    tutorial: 'The ultimate test: multi-objective optimization requires mastery of all systems!'
  }
];

// ============================================
// MISSION MANAGER
// ============================================
export class MissionManager {
  constructor() {
    this.missions = MISSIONS.map(config => new Mission(config));
    this.currentMission = null;
    this.missionStartTime = 0;
  }

  getMission(id) {
    return this.missions.find(m => m.id === id);
  }

  startMission(id, simulation) {
    const mission = this.getMission(id);
    if (!mission || !mission.unlocked) return false;

    this.currentMission = mission;
    this.missionStartTime = Date.now();

    // Apply constraints
    mission.applyConstraints(simulation);

    // Apply special setup if defined
    if (mission.specialSetup) {
      mission.specialSetup(simulation);
    }

    return true;
  }

  updateMission(simulation) {
    if (!this.currentMission) return null;

    // Check objectives
    const results = this.currentMission.checkObjectives(simulation);

    // Check if mission is complete
    if (this.currentMission.completed) {
      this.unlockNextMission();
    }

    return {
      mission: this.currentMission,
      objectives: results,
      timeElapsed: Math.floor((Date.now() - this.missionStartTime) / 1000)
    };
  }

  unlockNextMission() {
    const currentIndex = this.missions.findIndex(m => m.id === this.currentMission.id);
    if (currentIndex >= 0 && currentIndex < this.missions.length - 1) {
      this.missions[currentIndex + 1].unlocked = true;
    }
  }

  completeMission() {
    if (this.currentMission) {
      this.currentMission.completed = true;
      this.unlockNextMission();
    }
    this.currentMission = null;
  }

  getProgress() {
    const completed = this.missions.filter(m => m.completed).length;
    const total = this.missions.length;
    const totalStars = this.missions.reduce((sum, m) => sum + m.stars, 0);

    return {
      completed,
      total,
      percentage: (completed / total) * 100,
      totalStars,
      maxStars: total * 3
    };
  }
}
