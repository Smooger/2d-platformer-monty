const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const donutCountElement = document.getElementById("donut-count");

const GRAVITY = 0.5;
const MOVE_SPEED = 4.2;
const JUMP_STRENGTH = 11;

const input = {
  left: false,
  right: false,
  jump: false,
};

const player = {
  x: 80,
  y: 360,
  width: 46,
  height: 50,
  velocityX: 0,
  velocityY: 0,
  grounded: false,
  facing: 1,
};

const platforms = [
  { x: 0, y: 470, width: 960, height: 70 },
  { x: 140, y: 370, width: 140, height: 18 },
  { x: 360, y: 315, width: 160, height: 18 },
  { x: 600, y: 265, width: 160, height: 18 },
  { x: 760, y: 360, width: 140, height: 18 },
  { x: 420, y: 420, width: 140, height: 18 },
];

const donuts = [
  { x: 190, y: 330, radius: 16, collected: false },
  { x: 420, y: 275, radius: 16, collected: false },
  { x: 640, y: 225, radius: 16, collected: false },
  { x: 810, y: 330, radius: 16, collected: false },
  { x: 470, y: 390, radius: 16, collected: false },
];

let donutsCollected = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playCollectSound() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.16);
}

function handleInput(event, isPressed) {
  switch (event.code) {
    case "ArrowLeft":
    case "KeyA":
      input.left = isPressed;
      break;
    case "ArrowRight":
    case "KeyD":
      input.right = isPressed;
      break;
    case "Space":
    case "ArrowUp":
    case "KeyW":
      if (isPressed) {
        input.jump = true;
      }
      break;
    default:
      break;
  }
}

window.addEventListener("keydown", (event) => handleInput(event, true));
window.addEventListener("keyup", (event) => handleInput(event, false));

function applyPhysics() {
  player.velocityX = 0;
  if (input.left) {
    player.velocityX = -MOVE_SPEED;
    player.facing = -1;
  }
  if (input.right) {
    player.velocityX = MOVE_SPEED;
    player.facing = 1;
  }

  if (input.jump && player.grounded) {
    player.velocityY = -JUMP_STRENGTH;
    player.grounded = false;
  }
  input.jump = false;

  player.velocityY += GRAVITY;

  player.x += player.velocityX;
  player.y += player.velocityY;

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
}

function checkPlatformCollisions() {
  player.grounded = false;

  platforms.forEach((platform) => {
    const withinX =
      player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const hittingTop =
      player.y + player.height >= platform.y &&
      player.y + player.height - player.velocityY < platform.y;

    if (withinX && hittingTop) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }
  });

  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    player.grounded = true;
  }
}

function checkDonutCollection() {
  donuts.forEach((donut) => {
    if (donut.collected) {
      return;
    }
    const centerX = donut.x;
    const centerY = donut.y;
    const closestX = Math.max(player.x, Math.min(centerX, player.x + player.width));
    const closestY = Math.max(player.y, Math.min(centerY, player.y + player.height));
    const distance = Math.hypot(centerX - closestX, centerY - closestY);

    if (distance < donut.radius + 2) {
      donut.collected = true;
      donutsCollected += 1;
      donutCountElement.textContent = donutsCollected;
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      playCollectSound();
    }
  });
}

function drawBackground() {
  context.fillStyle = "#1f253a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 10; i += 1) {
    context.fillStyle = `rgba(255, 255, 255, ${0.08 + i * 0.01})`;
    context.beginPath();
    context.arc(80 + i * 90, 80 + (i % 2) * 30, 6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPlatforms() {
  platforms.forEach((platform) => {
    const gradient = context.createLinearGradient(
      platform.x,
      platform.y,
      platform.x,
      platform.y + platform.height
    );
    gradient.addColorStop(0, "#55607d");
    gradient.addColorStop(1, "#2c3248");

    context.fillStyle = gradient;
    context.fillRect(platform.x, platform.y, platform.width, platform.height);

    context.strokeStyle = "rgba(255, 255, 255, 0.1)";
    context.lineWidth = 2;
    context.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });
}

function drawDonut(donut) {
  if (donut.collected) {
    return;
  }

  context.fillStyle = "#f2b880";
  context.beginPath();
  context.arc(donut.x, donut.y, donut.radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#cf7f6c";
  context.beginPath();
  context.arc(donut.x, donut.y, donut.radius * 0.45, 0, Math.PI * 2);
  context.fill();

  const sprinkleColors = ["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#b983ff"];
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const sprinkleX = donut.x + Math.cos(angle) * (donut.radius * 0.65);
    const sprinkleY = donut.y + Math.sin(angle) * (donut.radius * 0.65);
    context.strokeStyle = sprinkleColors[i % sprinkleColors.length];
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(sprinkleX - 3, sprinkleY - 2);
    context.lineTo(sprinkleX + 3, sprinkleY + 2);
    context.stroke();
  }
}

function drawTurkey() {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;

  context.save();
  context.translate(centerX, centerY);
  context.scale(player.facing, 1);

  context.fillStyle = "#b56a3c";
  context.beginPath();
  context.ellipse(0, 6, 22, 18, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#d77a43";
  context.beginPath();
  context.ellipse(-10, -4, 10, 12, 0.2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#8a3e2c";
  context.beginPath();
  context.moveTo(8, -8);
  context.lineTo(22, -2);
  context.lineTo(8, 2);
  context.closePath();
  context.fill();

  context.fillStyle = "#ffb347";
  context.beginPath();
  context.arc(6, -2, 3.5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(-8, -8, 3.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#1d1d1d";
  context.beginPath();
  context.arc(-8, -8, 1.8, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

function draw() {
  drawBackground();
  drawPlatforms();
  donuts.forEach(drawDonut);
  drawTurkey();
}

function update() {
  applyPhysics();
  checkPlatformCollisions();
  checkDonutCollection();
  draw();
  requestAnimationFrame(update);
}

update();
