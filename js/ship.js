class Ship {
    constructor(hull, firepower, accuracy) {
        this.hull = hull;
        this.firepower = firepower;
        this.accuracy = accuracy;
    }

    attack(target, updateMessage) {
        if (Math.random() < this.accuracy) {
            target.takeDamage(this.firepower);
            updateMessage('Attack successful!');
        } else {
            updateMessage('Attack missed!');
        }
    }

    takeDamage(amount) {
        this.hull -= amount;
        if (this.hull <= 0) {
            this.hull = 0;
        }
    }
}
