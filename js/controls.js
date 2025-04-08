export function initControls(camera) {
    const controls = new THREE.PointerLockControls(camera, document.body);
    const blocker = document.getElementById("blocker");
    const instructions = document.getElementById("instructions");
    instructions.addEventListener("click", () => controls.lock());
    controls.addEventListener("lock", () => {
      blocker.style.display = "none";
    });
    controls.addEventListener("unlock", () => {
      blocker.style.display = "flex";
    });
    return controls;
  }