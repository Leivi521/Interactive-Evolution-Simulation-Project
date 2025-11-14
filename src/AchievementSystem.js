/**
 * ACHIEVEMENT SYSTEM
 * Tracks player accomplishments and milestones
 */

// ============================================
// ACHIEVEMENT CLASS
// ============================================
export class Achievement {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon || '🏆';
    this.unlocked = false;
    this.unlockedAt = null;
    this.check = config.check; // Function to check if unlocked
    this.secret = config.secret || false; // Hidden until unlocked
  }

  unlock() {
    if (!this.unlocked) {
      this.unlocked = true;
      this.unlockedAt = new Date();
      return true; // Return true if newly unlocked
    }
    return false;
  }
}

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================
export const ACHIEVEMENTS = [
  {
    id: 'first_mutation',
    name: 'First Mutation',
    description: 'Witness your first genetic mutation',
    icon: '🧬',
    check: (sim) => sim.generation >= 1
  },
  {
    id: 'perfect_generation',
    name: 'Perfect Generation',
    description: 'Complete a generation with no organism deaths',
    icon: '💯',
    check: (sim, history) => {
      // Check if last generation had no deaths
      return history.perfectGenerations > 0;
    }
  },
  {
    id: 'stable_ecosystem',
    name: 'Stable Ecosystem',
    description: 'Survive 20 generations without extinction',
    icon: '🌿',
    check: (sim) => sim.generation >= 20 && sim.getAliveCount() > 0
  },
  {
    id: 'frankenstein',
    name: 'Frankenstein',
    description: 'Perform aggressive gene editing (edit 5+ genes)',
    icon: '🧪',
    check: (sim, history) => history.genesEdited >= 5
  },
  {
    id: 'mass_extinction',
    name: 'Mass Extinction',
    description: 'Trigger an event that kills 90% of the population',
    icon: '☄️',
    check: (sim, history) => history.largestExtinction >= 90
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Evolve organisms with average speed above 7',
    icon: '⚡',
    check: (sim) => {
      if (sim.stats.avgSpeed.length === 0) return false;
      const current = sim.stats.avgSpeed[sim.stats.avgSpeed.length - 1];
      return current > 7;
    }
  },
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    description: 'Evolve organisms with average vision above 150',
    icon: '👁️',
    check: (sim) => {
      if (sim.stats.avgVision.length === 0) return false;
      const current = sim.stats.avgVision[sim.stats.avgVision.length - 1];
      return current > 150;
    }
  },
  {
    id: 'efficiency_expert',
    name: 'Efficiency Expert',
    description: 'Achieve average efficiency above 0.9',
    icon: '⚙️',
    check: (sim) => {
      if (sim.stats.avgEfficiency.length === 0) return false;
      const current = sim.stats.avgEfficiency[sim.stats.avgEfficiency.length - 1];
      return current > 0.9;
    }
  },
  {
    id: 'apex_predator',
    name: 'Apex Predator',
    description: 'Evolve organisms with aggression above 9',
    icon: '🦁',
    check: (sim) => {
      return sim.population.some(org => org.alive && org.genome.genes.aggression > 9);
    }
  },
  {
    id: 'gentle_giant',
    name: 'Gentle Giant',
    description: 'Evolve large organisms (size > 25) with low aggression (< 2)',
    icon: '🐘',
    check: (sim) => {
      return sim.population.some(org =>
        org.alive &&
        org.genome.genes.size > 25 &&
        org.genome.genes.aggression < 2
      );
    }
  },
  {
    id: 'population_boom',
    name: 'Population Boom',
    description: 'Reach a population of 50 or more',
    icon: '📈',
    check: (sim) => sim.getAliveCount() >= 50
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Recover from near extinction (from 3 or fewer to 20+)',
    icon: '🛡️',
    check: (sim, history) => history.nearExtinctionRecoveries > 0
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Reach generation 100',
    icon: '💯',
    check: (sim) => sim.generation >= 100
  },
  {
    id: 'diversity_champion',
    name: 'Diversity Champion',
    description: 'Maintain organisms with widely varied diet types',
    icon: '🌈',
    check: (sim) => {
      const alive = sim.population.filter(o => o.alive);
      const herbivores = alive.filter(o => o.genome.genes.dietType < 0.3).length;
      const carnivores = alive.filter(o => o.genome.genes.dietType > 0.7).length;
      const omnivores = alive.filter(o => o.genome.genes.dietType >= 0.3 && o.genome.genes.dietType <= 0.7).length;
      return herbivores >= 5 && carnivores >= 5 && omnivores >= 5;
    }
  },
  {
    id: 'mission_complete_all',
    name: 'Evolution Master',
    description: 'Complete all 10 missions',
    icon: '👑',
    secret: true,
    check: (sim, history) => history.missionsCompleted >= 10
  },
  {
    id: 'three_star_collector',
    name: 'Three Star Collector',
    description: 'Earn 3 stars on 5 different missions',
    icon: '⭐',
    check: (sim, history) => history.threeStarMissions >= 5
  },
  {
    id: 'god_mode',
    name: 'God Mode',
    description: 'Use every intervention tool at least once',
    icon: '⚡',
    secret: true,
    check: (sim, history) => {
      return history.clonesCreated > 0 &&
             history.mutationsForced > 0 &&
             history.genesEdited > 0 &&
             history.eventsTriggered > 0 &&
             history.organismsEliminated > 0;
    }
  },
  {
    id: 'hands_off',
    name: 'Hands Off',
    description: 'Reach generation 50 without any interventions',
    icon: '🙌',
    secret: true,
    check: (sim, history) => {
      return sim.generation >= 50 && history.totalInterventions === 0;
    }
  },
  {
    id: 'fitness_fanatic',
    name: 'Fitness Fanatic',
    description: 'Achieve average fitness above 500',
    icon: '💪',
    check: (sim) => {
      if (sim.stats.avgFitness.length === 0) return false;
      const current = sim.stats.avgFitness[sim.stats.avgFitness.length - 1];
      return current > 500;
    }
  },
  {
    id: 'the_architect',
    name: 'The Architect',
    description: 'Create a perfectly optimized organism with all traits above 80th percentile',
    icon: '🏗️',
    secret: true,
    check: (sim) => {
      return sim.population.some(org =>
        org.alive &&
        org.genome.genes.speed > 7 &&
        org.genome.genes.vision > 140 &&
        org.genome.genes.size > 20 &&
        org.genome.genes.efficiency > 0.85
      );
    }
  }
];

// ============================================
// ACHIEVEMENT MANAGER
// ============================================
export class AchievementManager {
  constructor() {
    this.achievements = ACHIEVEMENTS.map(config => new Achievement(config));

    // History tracking for complex achievements
    this.history = {
      genesEdited: 0,
      clonesCreated: 0,
      mutationsForced: 0,
      organismsEliminated: 0,
      eventsTriggered: 0,
      totalInterventions: 0,
      perfectGenerations: 0,
      largestExtinction: 0,
      nearExtinctionRecoveries: 0,
      missionsCompleted: 0,
      threeStarMissions: 0,
      previousPopulation: 0
    };

    this.newUnlocks = []; // Track recently unlocked achievements
  }

  // Check all achievements
  checkAchievements(simulation) {
    this.newUnlocks = [];

    for (let achievement of this.achievements) {
      if (!achievement.unlocked && achievement.check(simulation, this.history)) {
        if (achievement.unlock()) {
          this.newUnlocks.push(achievement);
        }
      }
    }

    return this.newUnlocks;
  }

  // Track interventions
  trackIntervention(type) {
    this.history.totalInterventions++;

    switch (type) {
      case 'clone':
        this.history.clonesCreated++;
        break;
      case 'mutate':
        this.history.mutationsForced++;
        break;
      case 'edit':
        this.history.genesEdited++;
        break;
      case 'eliminate':
        this.history.organismsEliminated++;
        break;
      case 'event':
        this.history.eventsTriggered++;
        break;
    }
  }

  // Track generation end events
  trackGeneration(simulation, prevPopulation) {
    const currentPop = simulation.getAliveCount();

    // Check for perfect generation (no deaths)
    if (prevPopulation > 0 && currentPop === prevPopulation) {
      this.history.perfectGenerations++;
    }

    // Check for mass extinction
    if (prevPopulation > 0) {
      const deathPercent = ((prevPopulation - currentPop) / prevPopulation) * 100;
      if (deathPercent > this.history.largestExtinction) {
        this.history.largestExtinction = deathPercent;
      }
    }

    // Check for near-extinction recovery
    if (this.history.previousPopulation <= 3 && currentPop >= 20) {
      this.history.nearExtinctionRecoveries++;
    }

    this.history.previousPopulation = currentPop;
  }

  // Track mission completion
  trackMissionComplete(stars) {
    this.history.missionsCompleted++;
    if (stars === 3) {
      this.history.threeStarMissions++;
    }
  }

  // Get achievement progress
  getProgress() {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const total = this.achievements.length;
    const visible = this.achievements.filter(a => !a.secret || a.unlocked);

    return {
      unlocked,
      total,
      visible: visible.length,
      percentage: (unlocked / total) * 100
    };
  }

  // Get achievements by category
  getUnlocked() {
    return this.achievements.filter(a => a.unlocked);
  }

  getLocked() {
    return this.achievements.filter(a => !a.unlocked && !a.secret);
  }

  getSecret() {
    return this.achievements.filter(a => a.secret && !a.unlocked);
  }
}
