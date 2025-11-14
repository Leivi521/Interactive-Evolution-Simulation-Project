/**
 * CREATURE ENCYCLOPEDIA
 * Tracks discovered species and their lineages
 */

// ============================================
// SPECIES RECORD
// ============================================
export class SpeciesRecord {
  constructor(organism, generation) {
    this.id = this.generateSpeciesId(organism.genome);
    this.genome = organism.genome.clone();
    this.discoveredAt = generation;
    this.lastSeen = generation;
    this.peakPopulation = 1;
    this.totalObserved = 1;
    this.extinct = false;
    this.extinctAt = null;
    this.parentSpeciesId = null;
    this.descendants = [];
    this.achievements = [];
  }

  // Generate a unique ID based on genome traits
  generateSpeciesId(genome) {
    const traits = genome.genes;
    const signature = `${Math.floor(traits.speed)}-${Math.floor(traits.vision / 10)}-${Math.floor(traits.size)}-${Math.floor(traits.efficiency * 10)}-${Math.floor(traits.aggression)}-${Math.floor(traits.dietType * 10)}`;
    return `species_${signature}_${Date.now()}`;
  }

  // Check if organism matches this species (with tolerance for minor mutations)
  matchesSpecies(organism) {
    const g1 = this.genome.genes;
    const g2 = organism.genome.genes;

    // Allow 10% variation in each trait
    const tolerance = 0.1;

    return (
      Math.abs(g1.speed - g2.speed) / g1.speed < tolerance &&
      Math.abs(g1.vision - g2.vision) / g1.vision < tolerance &&
      Math.abs(g1.size - g2.size) / g1.size < tolerance &&
      Math.abs(g1.efficiency - g2.efficiency) / g1.efficiency < tolerance &&
      Math.abs(g1.aggression - g2.aggression) / (g1.aggression + 0.1) < tolerance &&
      Math.abs(g1.dietType - g2.dietType) < 0.15
    );
  }

  update(generation) {
    this.lastSeen = generation;
    this.totalObserved++;
  }

  markExtinct(generation) {
    this.extinct = true;
    this.extinctAt = generation;
  }

  getDescription() {
    const traits = this.genome.genes;
    let desc = '';

    // Diet classification
    if (traits.dietType < 0.3) {
      desc += 'Herbivorous ';
    } else if (traits.dietType > 0.7) {
      desc += 'Carnivorous ';
    } else {
      desc += 'Omnivorous ';
    }

    // Size classification
    if (traits.size < 10) {
      desc += 'small ';
    } else if (traits.size > 20) {
      desc += 'large ';
    } else {
      desc += 'medium ';
    }

    // Behavior classification
    if (traits.aggression > 7) {
      desc += 'aggressive ';
    } else if (traits.aggression < 3) {
      desc += 'passive ';
    }

    desc += 'organism';

    // Special traits
    const specials = [];
    if (traits.speed > 7) specials.push('high-speed');
    if (traits.vision > 150) specials.push('keen-sighted');
    if (traits.efficiency > 0.85) specials.push('energy-efficient');
    if (traits.mutationStability > 0.8) specials.push('genetically-stable');

    if (specials.length > 0) {
      desc += ' with ' + specials.join(', ') + ' traits';
    }

    return desc;
  }

  getClassification() {
    const traits = this.genome.genes;

    // Classify based on dominant traits
    if (traits.aggression > 7 && traits.dietType > 0.6) {
      return 'Apex Predator';
    } else if (traits.speed > 6) {
      return 'Swift Hunter';
    } else if (traits.vision > 140) {
      return 'Observer';
    } else if (traits.efficiency > 0.8) {
      return 'Energy Conservator';
    } else if (traits.size > 22) {
      return 'Titan';
    } else if (traits.size < 8) {
      return 'Micro-organism';
    } else if (traits.dietType < 0.3) {
      return 'Herbivore';
    } else {
      return 'Generalist';
    }
  }
}

// ============================================
// ENCYCLOPEDIA MANAGER
// ============================================
export class Encyclopedia {
  constructor() {
    this.species = [];
    this.currentPopulationMap = new Map(); // Track current population by species
  }

  // Update encyclopedia with current population
  updateFromPopulation(population, generation) {
    const currentSpeciesIds = new Set();

    // Clear current population tracking
    this.currentPopulationMap.clear();

    // Process each organism
    for (let organism of population) {
      if (!organism.alive) continue;

      // Find matching species or create new one
      let speciesRecord = this.findMatchingSpecies(organism);

      if (!speciesRecord) {
        // New species discovered!
        speciesRecord = new SpeciesRecord(organism, generation);
        this.species.push(speciesRecord);
      } else {
        speciesRecord.update(generation);
      }

      currentSpeciesIds.add(speciesRecord.id);

      // Track population
      const currentCount = this.currentPopulationMap.get(speciesRecord.id) || 0;
      this.currentPopulationMap.set(speciesRecord.id, currentCount + 1);

      // Update peak population
      const newCount = this.currentPopulationMap.get(speciesRecord.id);
      if (newCount > speciesRecord.peakPopulation) {
        speciesRecord.peakPopulation = newCount;
      }
    }

    // Mark extinct species
    for (let speciesRecord of this.species) {
      if (!currentSpeciesIds.has(speciesRecord.id) && !speciesRecord.extinct) {
        speciesRecord.markExtinct(generation);
      }
    }
  }

  findMatchingSpecies(organism) {
    for (let speciesRecord of this.species) {
      if (speciesRecord.matchesSpecies(organism)) {
        return speciesRecord;
      }
    }
    return null;
  }

  // Get all discovered species
  getAllSpecies() {
    return this.species;
  }

  // Get living species
  getLivingSpecies() {
    return this.species.filter(s => !s.extinct);
  }

  // Get extinct species
  getExtinctSpecies() {
    return this.species.filter(s => s.extinct);
  }

  // Get species count
  getSpeciesCount() {
    return this.species.length;
  }

  getCurrentPopulation(speciesId) {
    return this.currentPopulationMap.get(speciesId) || 0;
  }

  // Get most successful species (by peak population)
  getMostSuccessful() {
    if (this.species.length === 0) return null;
    return this.species.reduce((best, current) =>
      current.peakPopulation > best.peakPopulation ? current : best
    );
  }

  // Get longest-lasting species
  getLongestLasting() {
    if (this.species.length === 0) return null;
    return this.species.reduce((best, current) => {
      const currentDuration = current.extinct
        ? current.extinctAt - current.discoveredAt
        : current.lastSeen - current.discoveredAt;
      const bestDuration = best.extinct
        ? best.extinctAt - best.discoveredAt
        : best.lastSeen - best.discoveredAt;
      return currentDuration > bestDuration ? current : best;
    });
  }

  // Get statistics
  getStats() {
    return {
      totalSpecies: this.species.length,
      livingSpecies: this.getLivingSpecies().length,
      extinctSpecies: this.getExtinctSpecies().length,
      mostSuccessful: this.getMostSuccessful()?.getClassification() || 'None',
      longestLasting: this.getLongestLasting()?.getClassification() || 'None'
    };
  }

  // Build lineage tree (simplified)
  buildLineageTree() {
    // Group species by their discovery generation
    const generations = {};

    for (let species of this.species) {
      const gen = species.discoveredAt;
      if (!generations[gen]) {
        generations[gen] = [];
      }
      generations[gen].push(species);
    }

    return generations;
  }
}
