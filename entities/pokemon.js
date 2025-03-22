export class Pokemon {
    id;
    species;
    gender;
    ability;
    hiddenPowerType;
    item;
    currentHp;
    maxHp;
    mimic;
    boosts = new Map();
    volatileStatuses = [];
    status;

    getNickname() {
        return this.species;
    }

    getFullname() {
        return this.species;
    }

    getName() {
        return this.species;
    }
}