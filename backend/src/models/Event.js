const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: [true, 'Event date and time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Event duration is required'],
    min: [30, 'Duration must be at least 30 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    courts: [{
      name: {
        type: String,
        required: function() {
          try {
            const event = this.parent().parent();
            return event && (event.eventType === 'sports' || event.eventType === 'tournament');
          } catch (e) {
            return false; // Don't require if we can't access parent
          }
        }
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  },
  eventType: {
    type: String,
    enum: ['sports', 'social', 'tournament', 'training'],
    required: [true, 'Event type is required'],
    default: 'sports'
  },
  format: {
    type: String,
    enum: ['singles', 'doubles', 'mixed', 'tournament'],
    required: function() {
      return this.eventType === 'sports' || this.eventType === 'tournament';
    }
  },
  skillLevelRange: {
    min: {
      type: Number,
      min: 1,
      max: 10,
      default: function() {
        return this.parent().eventType === 'social' ? undefined : 1;
      }
    },
    max: {
      type: Number,
      min: 1,
      max: 10,
      default: function() {
        return this.parent().eventType === 'social' ? undefined : 10;
      }
    }
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [2, 'At least 2 participants required'],
    max: [100, 'Maximum 100 participants allowed']
  },
  rsvpDeadline: {
    type: Date,
    required: [true, 'RSVP deadline is required']
  },
  registrationFee: {
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  rsvps: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['attending', 'maybe', 'declined'],
      default: 'attending'
    },
    skillLevel: {
      type: Number,
      min: 1,
      max: 10,
      required: function() {
        return this.parent().parent().eventType === 'sports' || this.parent().parent().eventType === 'tournament';
      }
    },
    preferredFormat: {
      type: String,
      enum: ['singles', 'doubles', 'mixed', 'any'],
      default: function() {
        return this.parent().parent().eventType === 'social' ? undefined : 'any';
      }
    },
    partnerPreference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    rsvpedAt: {
      type: Date,
      default: Date.now
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  matches: [{
    court: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    format: {
      type: String,
      enum: ['singles', 'doubles'],
      required: true
    },
    players: {
      team1: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      team2: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    score: {
      team1: {
        type: Number,
        default: 0
      },
      team2: {
        type: Number,
        default: 0
      },
      sets: [{
        team1: Number,
        team2: Number
      }]
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    winner: {
      type: String,
      enum: ['team1', 'team2', 'draw']
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  matchesGenerated: {
    type: Boolean,
    default: false
  },
  settings: {
    allowWaitlist: {
      type: Boolean,
      default: true
    },
    autoGenerateMatches: {
      type: Boolean,
      default: false
    },
    requireSkillLevel: {
      type: Boolean,
      default: function() {
        return this.parent().eventType === 'social' ? false : true;
      }
    }
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumFeatures: [{
    type: String,
    enum: ['auto_match_generation', 'advanced_analytics', 'live_scoring', 'tournament_brackets', 'custom_algorithms']
  }],
  isPremiumGeneration: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

eventSchema.virtual('attendingCount').get(function() {
  return this.rsvps ? this.rsvps.filter(rsvp => rsvp.status === 'attending').length : 0;
});

eventSchema.virtual('isRsvpOpen').get(function() {
  return new Date() < this.rsvpDeadline && this.status === 'published';
});

eventSchema.virtual('isEventActive').get(function() {
  const now = new Date();
  const eventEnd = new Date(this.dateTime.getTime() + (this.duration * 60000));
  return now >= this.dateTime && now <= eventEnd;
});

eventSchema.virtual('hasStarted').get(function() {
  return new Date() >= this.dateTime;
});

eventSchema.virtual('endTime').get(function() {
  return new Date(this.dateTime.getTime() + (this.duration * 60000));
});

eventSchema.pre('save', function(next) {
  console.log('=== EVENT PRE-SAVE HOOK ===');
  console.log('Event title:', this.title);
  console.log('Event status being saved:', this.status);
  console.log('Event organizer:', this.organizer);
  console.log('================================');

  if (this.rsvpDeadline >= this.dateTime) {
    return next(new Error('RSVP deadline must be before event start time'));
  }

  // Validate sports-specific fields for sports/tournament events
  if (this.eventType === 'sports' || this.eventType === 'tournament') {
    if (!this.format) {
      return next(new Error('Format is required for sports events'));
    }
    if (this.location.courts.length === 0) {
      return next(new Error('At least one court is required for sports events'));
    }
  }

  // For social events, clear sports-specific fields if accidentally set
  if (this.eventType === 'social') {
    this.format = undefined;
    this.location.courts = [];
    this.skillLevelRange = { min: undefined, max: undefined };
    this.settings.requireSkillLevel = false;
    this.settings.autoGenerateMatches = false;
  }

  next();
});

eventSchema.methods.addRsvp = function(userId, rsvpData) {
  const existingRsvp = this.rsvps.find(
    rsvp => rsvp.user.toString() === userId.toString()
  );

  if (existingRsvp) {
    Object.assign(existingRsvp, rsvpData);
  } else {
    this.rsvps.push({
      user: userId,
      ...rsvpData
    });
  }

  return this.save();
};

eventSchema.methods.removeRsvp = function(userId) {
  this.rsvps = this.rsvps.filter(
    rsvp => rsvp.user.toString() !== userId.toString()
  );
  return this.save();
};

eventSchema.methods.getUserRsvp = function(userId) {
  return this.rsvps.find(
    rsvp => rsvp.user.toString() === userId.toString()
  );
};

eventSchema.methods.canUserRsvp = function(userId) {
  if (!this.isRsvpOpen) return false;
  if (this.attendingCount >= this.maxParticipants) return false;
  return true;
};

eventSchema.methods.generateMatches = function() {
  // Only generate matches for sports events
  if (this.eventType === 'social') {
    return Promise.resolve([]);
  }

  const attendingPlayers = this.rsvps.filter(rsvp => rsvp.status === 'attending');

  if (this.format === 'doubles') {
    return this.generateDoublesMatches(attendingPlayers);
  } else if (this.format === 'mixed') {
    return this.generateMixedDoublesMatches(attendingPlayers);
  } else if (this.format === 'singles') {
    return this.generateSinglesMatches(attendingPlayers);
  }

  return [];
};

eventSchema.methods.generateDoublesMatches = function(players) {
  if (players.length < 4) return [];

  // Sort players by skill level for balanced team creation
  players.sort((a, b) => b.skillLevel - a.skillLevel);

  const matches = [];
  const courts = this.location.courts.filter(court => court.isAvailable);
  const numCourts = courts.length;

  // Calculate optimal number of rounds to ensure fair participation
  const targetGamesPerPlayer = 2;
  const playersPerMatch = 4;
  const minTotalMatches = Math.ceil((players.length * targetGamesPerPlayer) / playersPerMatch);

  // Track how many games each player has played and their opponents
  const playerGameCount = new Map();
  const playerOpponents = new Map();
  const playerPartners = new Map();

  players.forEach(p => {
    const playerId = p.user.toString();
    playerGameCount.set(playerId, 0);
    playerOpponents.set(playerId, new Set());
    playerPartners.set(playerId, new Set());
  });

  // Calculate match duration - distribute over time if multiple rounds needed
  const estimatedRounds = Math.ceil(minTotalMatches / numCourts);
  const matchDurationMs = numCourts >= minTotalMatches ?
    (this.duration * 60000) :
    (this.duration * 60000) / estimatedRounds;

  let matchIndex = 0;
  let currentTime = new Date(this.dateTime);

  // Generate matches until minimum games per player is reached
  while (matches.length < minTotalMatches) {
    // Find players who need more games, prioritizing those with fewer games
    const playersNeedingGames = players
      .filter(p => playerGameCount.get(p.user.toString()) < targetGamesPerPlayer)
      .sort((a, b) => {
        const aGames = playerGameCount.get(a.user.toString());
        const bGames = playerGameCount.get(b.user.toString());
        if (aGames !== bGames) return aGames - bGames;
        return Math.random() - 0.5; // Add randomness to avoid same pairings
      });

    if (playersNeedingGames.length < 4) {
      // If we can't form a full match with players needing games,
      // include players with fewer total games
      const allPlayersSorted = players.sort((a, b) => {
        const aGames = playerGameCount.get(a.user.toString());
        const bGames = playerGameCount.get(b.user.toString());
        if (aGames !== bGames) return aGames - bGames;
        return b.skillLevel - a.skillLevel;
      });

      if (allPlayersSorted.length < 4) break;

      // Take the 4 players with the least games
      const selectedPlayers = allPlayersSorted.slice(0, 4);

      // Create balanced teams
      const team1 = [selectedPlayers[0].user, selectedPlayers[3].user]; // Highest + Lowest skill
      const team2 = [selectedPlayers[1].user, selectedPlayers[2].user]; // 2nd highest + 2nd lowest skill

      // Update counters
      [...team1, ...team2].forEach(playerId => {
        const count = playerGameCount.get(playerId.toString()) || 0;
        playerGameCount.set(playerId.toString(), count + 1);
      });

      // Track opponents and partners for variety
      team1.forEach(p1 => {
        team1.forEach(p2 => {
          if (p1 !== p2) playerPartners.get(p1.toString()).add(p2.toString());
        });
        team2.forEach(p2 => {
          playerOpponents.get(p1.toString()).add(p2.toString());
        });
      });

      team2.forEach(p1 => {
        team2.forEach(p2 => {
          if (p1 !== p2) playerPartners.get(p1.toString()).add(p2.toString());
        });
      });

      const courtIndex = matchIndex % numCourts;
      const roundNumber = Math.floor(matchIndex / numCourts);

      const match = {
        court: courts[courtIndex].name,
        startTime: new Date(currentTime.getTime() + (roundNumber * matchDurationMs)),
        endTime: new Date(currentTime.getTime() + ((roundNumber + 1) * matchDurationMs)),
        format: 'doubles',
        players: {
          team1: team1,
          team2: team2
        },
        status: 'scheduled',
        round: roundNumber + 1
      };

      matches.push(match);
      matchIndex++;

    } else {
      // We have enough players needing games, create optimal match
      const selectedPlayers = playersNeedingGames.slice(0, 4);

      // Create balanced teams
      const team1 = [selectedPlayers[0].user, selectedPlayers[3].user];
      const team2 = [selectedPlayers[1].user, selectedPlayers[2].user];

      // Update all tracking
      [...team1, ...team2].forEach(playerId => {
        const count = playerGameCount.get(playerId.toString()) || 0;
        playerGameCount.set(playerId.toString(), count + 1);
      });

      const courtIndex = matchIndex % numCourts;
      const roundNumber = Math.floor(matchIndex / numCourts);

      const match = {
        court: courts[courtIndex].name,
        startTime: new Date(currentTime.getTime() + (roundNumber * matchDurationMs)),
        endTime: new Date(currentTime.getTime() + ((roundNumber + 1) * matchDurationMs)),
        format: 'doubles',
        players: {
          team1: team1,
          team2: team2
        },
        status: 'scheduled',
        round: roundNumber + 1
      };

      matches.push(match);
      matchIndex++;
    }

    // Safety break to avoid infinite loops
    if (matchIndex > players.length * 3) break;
  }

  this.matches = matches;
  this.matchesGenerated = true;
  return this.save();
};

eventSchema.methods.generateSinglesMatches = function(players) {
  if (players.length < 2) return [];

  // Sort players by skill level for balanced matchmaking
  players.sort((a, b) => b.skillLevel - a.skillLevel);

  const matches = [];
  const courts = this.location.courts.filter(court => court.isAvailable);
  const numCourts = courts.length;

  // Calculate optimal number of matches to ensure fair participation
  const targetGamesPerPlayer = 2;
  const playersPerMatch = 2;
  const minTotalMatches = Math.ceil((players.length * targetGamesPerPlayer) / playersPerMatch);

  // Track how many games each player has played and their opponents
  const playerGameCount = new Map();
  const playerOpponents = new Map();

  players.forEach(p => {
    const playerId = p.user.toString();
    playerGameCount.set(playerId, 0);
    playerOpponents.set(playerId, new Set());
  });

  // Calculate match duration - distribute over time if multiple rounds needed
  const estimatedRounds = Math.ceil(minTotalMatches / numCourts);
  const matchDurationMs = numCourts >= minTotalMatches ?
    (this.duration * 60000) :
    (this.duration * 60000) / estimatedRounds;

  let matchIndex = 0;
  let currentTime = new Date(this.dateTime);

  // Generate matches until minimum games per player is reached
  while (matches.length < minTotalMatches) {
    // Find players who need more games, prioritizing those with fewer games
    const playersNeedingGames = players
      .filter(p => playerGameCount.get(p.user.toString()) < targetGamesPerPlayer)
      .sort((a, b) => {
        const aGames = playerGameCount.get(a.user.toString());
        const bGames = playerGameCount.get(b.user.toString());
        if (aGames !== bGames) return aGames - bGames;
        return Math.random() - 0.5; // Add randomness for variety
      });

    if (playersNeedingGames.length < 2) {
      // If we can't form a match with players needing games,
      // include players with fewer total games
      const allPlayersSorted = players.sort((a, b) => {
        const aGames = playerGameCount.get(a.user.toString());
        const bGames = playerGameCount.get(b.user.toString());
        if (aGames !== bGames) return aGames - bGames;
        return b.skillLevel - a.skillLevel;
      });

      if (allPlayersSorted.length < 2) break;

      // Take the 2 players with the least games
      const selectedPlayers = allPlayersSorted.slice(0, 2);

      // Update counters
      selectedPlayers.forEach(player => {
        const playerId = player.user.toString();
        const count = playerGameCount.get(playerId) || 0;
        playerGameCount.set(playerId, count + 1);
      });

      // Track opponents for variety in future matches
      const p1Id = selectedPlayers[0].user.toString();
      const p2Id = selectedPlayers[1].user.toString();
      playerOpponents.get(p1Id).add(p2Id);
      playerOpponents.get(p2Id).add(p1Id);

      const courtIndex = matchIndex % numCourts;
      const roundNumber = Math.floor(matchIndex / numCourts);

      const match = {
        court: courts[courtIndex].name,
        startTime: new Date(currentTime.getTime() + (roundNumber * matchDurationMs)),
        endTime: new Date(currentTime.getTime() + ((roundNumber + 1) * matchDurationMs)),
        format: 'singles',
        players: {
          team1: [selectedPlayers[0].user],
          team2: [selectedPlayers[1].user]
        },
        status: 'scheduled',
        round: roundNumber + 1
      };

      matches.push(match);
      matchIndex++;

    } else {
      // We have enough players needing games, create optimal match
      // Try to avoid repeat opponents if possible
      let player1 = playersNeedingGames[0];
      let player2 = null;

      // Find an opponent this player hasn't faced yet
      for (let i = 1; i < playersNeedingGames.length; i++) {
        const candidateId = playersNeedingGames[i].user.toString();
        if (!playerOpponents.get(player1.user.toString()).has(candidateId)) {
          player2 = playersNeedingGames[i];
          break;
        }
      }

      // If no new opponent found, just take the next available player
      if (!player2) {
        player2 = playersNeedingGames[1];
      }

      // Update tracking
      const p1Id = player1.user.toString();
      const p2Id = player2.user.toString();

      playerGameCount.set(p1Id, (playerGameCount.get(p1Id) || 0) + 1);
      playerGameCount.set(p2Id, (playerGameCount.get(p2Id) || 0) + 1);

      playerOpponents.get(p1Id).add(p2Id);
      playerOpponents.get(p2Id).add(p1Id);

      const courtIndex = matchIndex % numCourts;
      const roundNumber = Math.floor(matchIndex / numCourts);

      const match = {
        court: courts[courtIndex].name,
        startTime: new Date(currentTime.getTime() + (roundNumber * matchDurationMs)),
        endTime: new Date(currentTime.getTime() + ((roundNumber + 1) * matchDurationMs)),
        format: 'singles',
        players: {
          team1: [player1.user],
          team2: [player2.user]
        },
        status: 'scheduled',
        round: roundNumber + 1
      };

      matches.push(match);
      matchIndex++;
    }

    // Safety break to avoid infinite loops
    if (matchIndex > players.length * 3) break;
  }

  this.matches = matches;
  this.matchesGenerated = true;
  return this.save();
};

eventSchema.methods.generateMixedDoublesMatches = function(players) {
  if (players.length < 4) return [];

  // Filter players by gender
  const malePlayers = players.filter(p => p.user.gender === 'male');
  const femalePlayers = players.filter(p => p.user.gender === 'female');
  const otherPlayers = players.filter(p => p.user.gender === 'other');

  // If we don't have at least 2 males and 2 females, fall back to regular doubles
  if (malePlayers.length < 2 || femalePlayers.length < 2) {
    console.log('Insufficient gender balance for pure mixed doubles, using hybrid approach');
    return this.generateDoublesMatches(players);
  }

  // Sort by skill level for balanced teams
  malePlayers.sort((a, b) => b.user.skillLevel - a.user.skillLevel);
  femalePlayers.sort((a, b) => b.user.skillLevel - a.user.skillLevel);
  otherPlayers.sort((a, b) => b.user.skillLevel - a.user.skillLevel);

  const matches = [];
  const courts = this.location.courts.filter(court => court.isAvailable);
  const numCourts = courts.length;

  // Calculate balanced mixed pairs
  const balancedCount = Math.min(malePlayers.length, femalePlayers.length);
  const mixedMales = malePlayers.slice(0, balancedCount);
  const mixedFemales = femalePlayers.slice(0, balancedCount);

  // Remaining players for regular doubles
  const extraMales = malePlayers.slice(balancedCount);
  const extraFemales = femalePlayers.slice(balancedCount);
  const remainingPlayers = [...extraMales, ...extraFemales, ...otherPlayers];

  // Track player participation for all players
  const playerUsage = new Map();
  players.forEach(p => playerUsage.set(p.user.id, 0));

  const targetGamesPerPlayer = 2;
  let round = 0;

  // Create all possible match combinations ensuring everyone gets at least 2 games
  const allPlayersList = [...mixedMales, ...mixedFemales, ...remainingPlayers];
  const totalGamesNeeded = allPlayersList.length * targetGamesPerPlayer;
  const targetTotalMatches = Math.ceil(totalGamesNeeded / 4);

  let matchIndex = 0;

  // Generate matches until everyone has played at least 2 games
  while (matchIndex < targetTotalMatches) {
    const roundMatches = [];
    const usedThisRound = new Set();

    for (let courtIndex = 0; courtIndex < numCourts && roundMatches.length < numCourts; courtIndex++) {
      let match = null;

      // Try to create a mixed doubles match first
      if (mixedMales.length >= 2 && mixedFemales.length >= 2) {
        const availableMales = mixedMales.filter(p => !usedThisRound.has(p.user.id));
        const availableFemales = mixedFemales.filter(p => !usedThisRound.has(p.user.id));

        if (availableMales.length >= 2 && availableFemales.length >= 2) {
          // Sort by current usage (least played first)
          availableMales.sort((a, b) => playerUsage.get(a.user.id) - playerUsage.get(b.user.id));
          availableFemales.sort((a, b) => playerUsage.get(a.user.id) - playerUsage.get(b.user.id));

          const male1 = availableMales[0];
          const male2 = availableMales[1];
          const female1 = availableFemales[0];
          const female2 = availableFemales[1];

          // Create balanced mixed teams
          const team1 = [male1.user, female1.user];
          const team2 = [male2.user, female2.user];

          match = {
            court: courts[courtIndex].name,
            startTime: new Date(new Date(this.dateTime).getTime() + round * 60 * 60 * 1000),
            endTime: new Date(new Date(this.dateTime).getTime() + (round + 1) * 60 * 60 * 1000),
            format: 'doubles',
            players: { team1, team2 },
            score: { team1: 0, team2: 0, sets: [] },
            status: 'scheduled'
          };

          usedThisRound.add(male1.user.id);
          usedThisRound.add(male2.user.id);
          usedThisRound.add(female1.user.id);
          usedThisRound.add(female2.user.id);

          playerUsage.set(male1.user.id, playerUsage.get(male1.user.id) + 1);
          playerUsage.set(male2.user.id, playerUsage.get(male2.user.id) + 1);
          playerUsage.set(female1.user.id, playerUsage.get(female1.user.id) + 1);
          playerUsage.set(female2.user.id, playerUsage.get(female2.user.id) + 1);
        }
      }

      // If no mixed match created, create regular doubles match with remaining players
      if (!match && remainingPlayers.length >= 4) {
        const availableRemaining = remainingPlayers.filter(p => !usedThisRound.has(p.user.id));

        if (availableRemaining.length >= 4) {
          // Sort by current usage (least played first)
          availableRemaining.sort((a, b) => playerUsage.get(a.user.id) - playerUsage.get(b.user.id));

          const player1 = availableRemaining[0];
          const player2 = availableRemaining[1];
          const player3 = availableRemaining[2];
          const player4 = availableRemaining[3];

          // Create balanced teams
          const team1 = [player1.user, player4.user];
          const team2 = [player2.user, player3.user];

          match = {
            court: courts[courtIndex].name,
            startTime: new Date(new Date(this.dateTime).getTime() + round * 60 * 60 * 1000),
            endTime: new Date(new Date(this.dateTime).getTime() + (round + 1) * 60 * 60 * 1000),
            format: 'doubles',
            players: { team1, team2 },
            score: { team1: 0, team2: 0, sets: [] },
            status: 'scheduled'
          };

          usedThisRound.add(player1.user.id);
          usedThisRound.add(player2.user.id);
          usedThisRound.add(player3.user.id);
          usedThisRound.add(player4.user.id);

          playerUsage.set(player1.user.id, playerUsage.get(player1.user.id) + 1);
          playerUsage.set(player2.user.id, playerUsage.get(player2.user.id) + 1);
          playerUsage.set(player3.user.id, playerUsage.get(player3.user.id) + 1);
          playerUsage.set(player4.user.id, playerUsage.get(player4.user.id) + 1);
        }
      }

      if (match) {
        roundMatches.push(match);
      }
    }

    matches.push(...roundMatches);
    round++;

    // Check if everyone has played at least target games
    const minGamesPlayed = Math.min(...Array.from(playerUsage.values()));
    if (minGamesPlayed >= targetGamesPerPlayer && roundMatches.length === 0) break;

    if (matchIndex > players.length * 3) break; // Safety break
    matchIndex++;
  }

  this.matches = matches;
  this.matchesGenerated = true;
  return this.save();
};

eventSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Event', eventSchema);