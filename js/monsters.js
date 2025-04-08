// monsters.js

export function spawnMonsters(scene, getTerrainHeight) {
    let monsters = [];
    const numMonsters = 5;
    for (let i = 0; i < numMonsters; i++) {
      let angle = Math.random() * Math.PI * 2;
      let distance = 200 + Math.random() * 50;
      let x = Math.cos(angle) * distance;
      let z = Math.sin(angle) * distance;
      let y = getTerrainHeight(x, z) + 3;
      let monsterGeometry = new THREE.SphereGeometry(6, 16, 16);
      let monsterMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        shininess: 30,         // Reduced shininess for a gooier, slime-like look.
        specular: 0x009900,
        transparent: true,
        opacity: 0.7,
        emissive: 0x003300
      });
      let monsterMesh = new THREE.Mesh(monsterGeometry, monsterMaterial);
      monsterMesh.position.set(x, y, z);
      scene.add(monsterMesh);
      monsters.push({
        mesh: monsterMesh,
        speed: 10 + Math.random() * 5,
        attackCooldown: 0,
        originalColor: 0x00ff00
      });
    }
    return monsters;
  }
  
  export function updateMonsters(monsters, castleTarget, castleWallBounds, delta, scene, onCastleHit) {
    monsters.forEach(monster => {
      monster.attackCooldown = Math.max(monster.attackCooldown - delta, 0);
      let directionToCastle = new THREE.Vector3().subVectors(castleTarget, monster.mesh.position);
      directionToCastle.y = 0;
      directionToCastle.normalize();
      let movement = directionToCastle.clone().multiplyScalar(monster.speed * delta);
      let candidatePos = monster.mesh.position.clone().add(movement);
      
      // Check collision with castle walls.
      if (castleTarget && castleWallBounds.length > 0) {
        for (let wall of castleWallBounds) {
          if (
            candidatePos.x > wall.minX - 6 &&
            candidatePos.x < wall.maxX + 6 &&
            candidatePos.z > wall.minZ - 6 &&
            candidatePos.z < wall.maxZ + 6
          ) {
            if (monster.attackCooldown <= 0) {
              onCastleHit();
              monster.attackCooldown = 1.0;
              monster.mesh.material.color.set(0xff0000);
              setTimeout(() => {
                monster.mesh.material.color.set(monster.originalColor);
              }, 200);
            }
            return;
          }
        }
      }
      monster.mesh.position.copy(candidatePos);
    });
  }
  
  export function popSlime(monster, scene) {
    const mesh = monster.mesh;
    const initialScale = mesh.scale.clone();
    const duration = 300; // Duration of the pop effect in milliseconds.
    const startTime = performance.now();
    
    // Create a bubble pop effect.
    const bubbleGeometry = new THREE.CircleGeometry(8, 32);
    const bubbleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.8, 
      side: THREE.DoubleSide 
    });
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.copy(mesh.position);
    bubble.rotation.x = -Math.PI / 2; // Make it lay flat.
    scene.add(bubble);
    
    function animateBubble() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      bubble.scale.set(1 + t, 1 + t, 1 + t);
      bubble.material.opacity = 0.8 * (1 - t);
      if (t < 1) {
        requestAnimationFrame(animateBubble);
      } else {
        scene.remove(bubble);
      }
    }
    animateBubble();
    
    // Animate the monster shrinking (pop effect).
    function animatePop() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      mesh.scale.set(
        initialScale.x * (1 - t),
        initialScale.y * (1 - t),
        initialScale.z * (1 - t)
      );
      if (t < 1) {
        requestAnimationFrame(animatePop);
      } else {
        scene.remove(mesh);
      }
    }
    animatePop();
  }