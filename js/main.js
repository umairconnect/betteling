const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

class Ship {
    constructor(hull, firepower, accuracy, x, y, color, image) {
        this.hull = hull;
        this.firepower = firepower;
        this.accuracy = accuracy;
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = 50;
        this.height = 30;
        this.lasers = [];
        this.image = image;
    }

    attack(target, updateMessage) {
        if (Math.random() < this.accuracy) {
            target.takeDamage(this.firepower);
            updateMessage('Attack successful!');
            this.fireLaser(target);
            return true; // Indicate successful hit
        } else {
            updateMessage('Attack missed!');
            return false; // Indicate missed attack
        }
    }

    takeDamage(amount) {
        this.hull -= amount;
        if (this.hull <= 0) {
            this.hull = 0;
        }
    }

    draw() {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height); // Drawing the ship
        }
        this.drawLasers();
    }

    fireLaser(target) {
        this.lasers.push({
            x: this.x + this.width / 2,
            y: this.y,
            targetX: target.x + target.width / 2,
            targetY: target.y,
            color: this.color
        });
        this.animateLasers();
    }

    drawLasers() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        this.lasers.forEach(laser => {
            ctx.beginPath();
            ctx.moveTo(laser.x, laser.y);
            ctx.lineTo(laser.targetX, laser.targetY);
            ctx.stroke();
        });
    }

    animateLasers() {
        const laserAnimation = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGame(); // Redraw ships and lasers
            this.lasers = this.lasers.filter(laser => {
                // Move lasers towards the target
                const dx = laser.targetX - laser.x;
                const dy = laser.targetY - laser.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 5) { // Continue animation
                    laser.x += dx * 0.05; // Adjust these values to control the speed of the laser
                    laser.y += dy * 0.05;
                    return true; // Keep the laser
                }
                return false; // Remove the laser when it reaches the target
            });
            if (this.lasers.length > 0) {
                requestAnimationFrame(laserAnimation);
            }
        };
        laserAnimation();
    }
}

const playerImage = new Image();
playerImage.src = 'player-ship.png'; // Path to your custom player ship image
const alienImage = new Image();
alienImage.src = 'alien-ship.png'; // Path to your custom alien ship image

const player = new Ship(20, 5, 0.7, 375, 500, 'blue', playerImage);
let currentAlien = null;
const alienCount = 6; // Total number of aliens
let wins = 0;
let currentAlienIndex = 0;
let battleInProgress = false;

function createAlien() {
    const hull = Math.floor(Math.random() * (6 - 3 + 1)) + 3;
    const firepower = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
    const accuracy = Math.random() * (0.8 - 0.6) + 0.6;
    const x = Math.random() * (canvas.width - 50);
    const y = 50;
    return new Ship(hull, firepower, accuracy, x, y, 'red', alienImage);
}

function updateStatus() {
    document.getElementById('message').textContent = `Player Hull: ${player.hull} | Alien Hull: ${currentAlien ? currentAlien.hull : 'N/A'}`;
    document.getElementById('alienCounter').textContent = `Alien: ${currentAlienIndex + 1} of ${alienCount}`;
    document.getElementById('score').textContent = `Score: ${wins}`;
}

function updateMessage(message) {
    document.getElementById('message').textContent = message;
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    if (currentAlien) {
        currentAlien.draw();
    }
}

async function battle(player, alien) {
    let alignmentCheck = true; // Variable to check if the attack was aligned

    while (player.hull > 0 && alien.hull > 0) {
        // Player attacks first
        const playerHit = player.attack(alien, updateMessage);
        await new Promise(r => setTimeout(r, 1000)); // Wait for laser animation to complete

        // Check if the alien is destroyed
        if (alien.hull <= 0) {
            return true; // Alien destroyed, player wins this round
        }

        // If the player's attack was misaligned (missed)
        if (!playerHit) {
            alignmentCheck = false; // Attack missed
            // Alien attacks back if player missed
            const alienHit = alien.attack(player, updateMessage);
            await new Promise(r => setTimeout(r, 1000)); // Wait for alien attack animation

            if (player.hull <= 0) {
                return false; // Player destroyed, game over
            }
        } else {
            // Reset alignmentCheck if attack was successful
            alignmentCheck = true;
        }

        updateStatus();
        drawGame();
    }
    return player.hull > 0; // Player wins if they still have hull points
}

document.addEventListener('keydown', function (event) {
    const movementSpeed = 10; // Speed of movement
    if (event.key === 'ArrowLeft') {
        player.x -= movementSpeed;
        if (player.x < 0) {
            player.x = 0; // Prevent the ship from going off the left edge
        }
    } else if (event.key === 'ArrowRight') {
        player.x += movementSpeed;
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width; // Prevent the ship from going off the right edge
        }
    }
    drawGame(); // Redraw the game after moving the ship
});

async function startNewRound() {
    if (currentAlienIndex < alienCount) {
        currentAlien = createAlien();
        document.getElementById('attack').disabled = false;
        document.getElementById('retreat').disabled = false;
        updateStatus();
        updateMessage('Prepare for battle!');
        drawGame();
    } else {
        updateMessage('You have destroyed all aliens! You win!');
        document.getElementById('attack').style.display = 'none';
        document.getElementById('retreat').style.display = 'none';
        document.getElementById('restart').style.display = 'block';
    }
}

document.getElementById('attack').addEventListener('click', async function () {
    if (battleInProgress) return; // Prevent additional clicks while battle is ongoing

    if (!currentAlien) {
        startNewRound();
        return;
    }

    battleInProgress = true;
    const result = await battle(player, currentAlien);

    if (result) {
        wins++;
        currentAlienIndex++;
        updateMessage('Alien destroyed! Choose to continue or retreat.');
        updateStatus();
        if (currentAlienIndex < alienCount) {
            setTimeout(startNewRound, 2000);
        } else {
            updateMessage('You have destroyed all aliens! You win!');
            document.getElementById('attack').style.display = 'none';
            document.getElementById('retreat').style.display = 'none';
            document.getElementById('restart').style.display = 'block';
        }
    } else {
        updateMessage('Game Over! Click Retreat to exit.');
        document.getElementById('attack').disabled = true;
        document.getElementById('retreat').disabled = true;
        document.getElementById('restart').style.display = 'block';
    }
    battleInProgress = false;
});

document.getElementById('retreat').addEventListener('click', function () {
    updateMessage('You retreated. Game over!');
    document.getElementById('attack').disabled = true;
    document.getElementById('retreat').disabled = true;
    document.getElementById('restart').style.display = 'block';
});

document.getElementById('restart').addEventListener('click', function () {
    location.reload();
});

// Initialize the game
startNewRound();