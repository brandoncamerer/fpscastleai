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
    
    // Increase trunk height from 16 to 20.
    let trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 20, 8),
      new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    );
    // Adjust trunk position so its bottom is closer to the ground.
    trunk.position.set(x, h + 10, z);  // Raised by 2 units (from h+8 to h+10)
    scene.add(trunk);
    
    // Create a group for the evergreen canopy.
    const canopyGroup = new THREE.Group();
    
    // Bottom layer: increase cone radius from 8 to 10.
    const bottomCone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 16, 8),
      new THREE.MeshLambertMaterial({ color: 0x2e8b57 })
    );
    bottomCone.position.set(0, 0, 0);
    
    // Middle layer: increase cone radius from 6 to 8.
    const middleCone = new THREE.Mesh(
      new THREE.ConeGeometry(8, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x228b22 })
    );
    middleCone.position.set(0, 8, 0);
    
    // Top layer: increase cone radius from 4 to 5.
    const topCone = new THREE.Mesh(
      new THREE.ConeGeometry(5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x006400 })
    );
    topCone.position.set(0, 16, 0);
    
    // Add all cones to the canopy group.
    canopyGroup.add(bottomCone);
    canopyGroup.add(middleCone);
    canopyGroup.add(topCone);
    
    // Raise the canopy slightly; previously placed at h + 14,
    // now shift upward to align with the taller trunk.
    canopyGroup.position.set(x, h + 18, z);
    scene.add(canopyGroup);
    
    // Save both trunk and canopy as part of the tree obstacles.
    obstacles.push({ x: x, z: z, radius: 5, type: "tree", meshes: [trunk, canopyGroup] });
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