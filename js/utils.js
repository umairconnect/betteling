// js/utils.js

function createAlien() {
    const hull = Math.floor(Math.random() * (6 - 3 + 1)) + 3;
    const firepower = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
    const accuracy = Math.random() * (0.8 - 0.6) + 0.6;
    return new Ship(hull, firepower, accuracy);
}
