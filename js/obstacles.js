export function initObstacles(scene, getTerrainHeight) {
    let obstacles = [];
    let rockCount = 0;
  
    // Create trees.
    for (let i = 0; i < 10; i++) {
      let x = (Math.random() - 0.5) * 500;
      let z = (Math.random() - 0.5) * 500;
      createTree(x, z, scene, getTerrainHeight, obstacles);
    }
  
    // Create rocks.
    const totalRocks = 20;
    for (let i = 0; i < totalRocks; i++) {
      let x = Math.random() * 500 - 250;
      let z = Math.random() * 500 - 250;
      createRock(x, z, scene, getTerrainHeight, obstacles);
    }
  
    return { obstacles, rockCount };
  }
  
  function createTree(x, z, scene, getTerrainHeight, obstacles) {
    const h = getTerrainHeight(x, z);
    let trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 20, 8),
      new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    );
    trunk.position.set(x, h + 10, z);
    scene.add(trunk);
    let canopy = new THREE.Mesh(
      new THREE.ConeGeometry(8, 16, 8),
      new THREE.MeshLambertMaterial({ color: 0x228b22 })
    );
    canopy.position.set(x, h + 28, z);
    scene.add(canopy);
    obstacles.push({ x: x, z: z, radius: 5, type: "tree", meshes: [trunk, canopy] });
  }
  
  function createRock(x, z, scene, getTerrainHeight, obstacles) {
    const h = getTerrainHeight(x, z);
    let rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(5, 0),
      new THREE.MeshLambertMaterial({ color: 0x808080 })
    );
    rock.position.set(x, h + 2.5, z);
    scene.add(rock);
    obstacles.push({ x: x, z: z, radius: 3, type: "rock", mesh: rock });
  }