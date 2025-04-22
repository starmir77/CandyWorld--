import * as THREE from 'three';

export const universeBackground =  'Assets/Candies/candySpace.exr';

export const worlds = {
  Gumdrop: {
    name: "Gumdrop",
    color: 0xF8CBD6,
    emissive: 0xF8CBD6,
    position: new THREE.Vector3(0, 9, 60),
    model: "Assets/Candies/lollipop_model.glb",
    clickSound: "Assets/Sounds/gumdropClick.mp3",
    transitionSound: "Assets/Sounds/transitionSound2.mp3",
    scale: new THREE.Vector3(0.08, 0.08, 0.08),
    rotation: new THREE.Euler(0, Math.PI / 2, - Math.PI / 2),
    geometry: {
      type: "icosahedron",
      radius: 8,
      detail: 4
    },
    interiorSky: {
      texture: "Assets/Candies/gumdropWorld.png",
      radius: 8
    }
  },
  Chocoworld: {
    name: "Chocoworld",
    color: 0x3d0c02,
    emissive: 0xdb7093,
    position: new THREE.Vector3(-10, 0, 14),
    model: "Assets/Candies/chocolate_model.glb",
    clickSound: "Assets/Sounds/chocolateClick.mp3",
    transitionSound: "Assets/Sounds/transitionSound3.mp3",
    scale: new THREE.Vector3(1, 1, 1),
    rotation: new THREE.Euler(Math.PI / 4, 0, 0),
    geometry: {
      type: "icosahedron",
      radius: 6,
      detail: 3
    },
    interiorSky: {
      texture: "Assets/Candies/chocoWorld.png",
      radius: 6
    }
  },
  Cupcakey: {
    name: "Cupcakey",
    color: 0xC255B3,
    emissive: 0xC255B3,
    position: new THREE.Vector3(10, -10, 30),
    model: "Assets/Candies/cupcake_model.glb",
    clickSound: "Assets/Sounds/cupcakeClick.mp3",
    transitionSound: "Assets/Sounds/transitionSound4.mp3",
    scale: new THREE.Vector3(3, 3, 3),
    rotation: new THREE.Euler(0, 0, 0),
    geometry: {
      type: "icosahedron",
      radius: 7,
      detail: 4
    },
    interiorSky: {
      texture: "Assets/Candies/cupcakeyWorld.png",
      radius: 7
    }
  }
};

export function createPlanetMeshes(worldsData) {
  const meshes = [];

  for (const key in worldsData) {
    const world = worldsData[key];

    const { radius = 5, detail = 0 } = world.geometry || {};
    const geo = new THREE.IcosahedronGeometry(radius, detail);

    const mat = new THREE.MeshStandardMaterial({
      color: world.color,
      emissive: world.emissive,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.3

    });

    const planet = new THREE.Mesh(geo, mat);
    planet.position.copy(world.position);
    planet.userData.worldName = world.name;

    meshes.push(planet);
  }
  return meshes;
}

export function createSkyDome(world) {
  if (!world.interiorSky || !world.interiorSky.texture) return null;

  const texture = new THREE.TextureLoader().load(world.interiorSky.texture);
  const geometry = new THREE.SphereGeometry(world.interiorSky.radius || 200, 64, 64);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide
  });

  const skyDome = new THREE.Mesh(geometry, material);
  skyDome.name = "interiorSky";
  return skyDome;
}



