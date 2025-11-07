import { GAME_CONFIG } from './constants.js';

const gameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem('candyworld_highscore')) || 0,
    currentWorldIndex: 0,
    spawnInterval: GAME_CONFIG.INITIAL_SPAWN_INTERVAL,
    gameStarted: false,
    fallSpeed: GAME_CONFIG.FALL_SPEED,
    levelSpeed: GAME_CONFIG.DIFFICULTY_MULTIPLIER,
    nextLevelScore: GAME_CONFIG.POINTS_PER_LEVEL,
  };

  export default gameState;
  