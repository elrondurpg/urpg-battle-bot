export class Pokemon {
    id;
    nickname;
    species;
    gender;
    ability;
    hiddenPowerType;
    item;
    currentHp;
    maxHp;
    mimic;
    useGmaxForm = false;
    boosts = new Map();
    volatileStatuses = [];
    status;
    teraType;
    conversionType;

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