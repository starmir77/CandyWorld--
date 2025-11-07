// Game configuration constants
// Centralizes all magic numbers for easy tuning

export const GAME_CONFIG = {
  // Level progression
  POINTS_PER_LEVEL: 10,
  DIFFICULTY_MULTIPLIER: 0.9, // Spawn interval multiplier per level (0.9 = 10% faster)

  // Candy spawning
  INITIAL_SPAWN_INTERVAL: 1000, // ms between candy spawns
  MAX_ACTIVE_CANDIES: 100,
  FALL_SPEED: 0.025,

  // UI timings
  TRANSITION_DELAY: 2500, // ms - delay between level transitions
  INSTRUCTION_DURATION: 4000, // ms - how long to show instructions

  // Camera animation
  CAMERA_ANIMATION_DURATION: 2000, // ms - time to fly to a world

  // Performance
  MAX_PIXEL_RATIO: 2, // Cap for devicePixelRatio
};

export const ASSET_CONFIG = {
  // Asset loading retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms - base delay for exponential backoff
  ASSET_TIMEOUT: 30000, // ms - 30 seconds
  AUDIO_TIMEOUT: 10000, // ms - 10 seconds
};

export const VISUAL_CONFIG = {
  // Scene lighting
  AMBIENT_LIGHT_BASE_INTENSITY: 5,
  AMBIENT_LIGHT_PULSE_AMOUNT: 0.5,
  AMBIENT_LIGHT_PULSE_SPEED: 0.001,

  // Stars
  STAR_COUNT: 1000,
  STAR_SIZE: 2,
  STAR_SPREAD: 2000,

  // Fallback colors
  FALLBACK_SPACE_COLOR: 0x1a0033, // Dark purple
};
