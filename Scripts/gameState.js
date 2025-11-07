const gameState = {
    score: 0,
    currentWorldIndex: 0,
    spawnInterval: 1000,
    gameStarted: false,
    fallSpeed: 0.025,
    levelSpeed: 0.9, // multiplier for spawn interval (0.9 = 10% faster each level)
    nextLevelScore: 10,
  };
  
  export default gameState;
  