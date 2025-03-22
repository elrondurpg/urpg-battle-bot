export const GENERATIONS = [ "Standard"/*, "GSC", "RSE", "XY", "SM", "SwSh", "SV"*/ ];
export const BATTLE_TYPES = [ "Singles"/*, "Doubles", "FFA "*/];
export const SEND_TYPES = [ "Public", "Private" ];
export const TEAM_TYPES = [ /*"Open",*/ "Full", "Preview" ];
export const STARTING_WEATHERS = [ "None", "Rain", "Sun", "Hail", "Snow", "Sandstorm", "Fog" ];
export const STARTING_TERRAINS = [ "Building", "Cave", "Ice", "Puddles", "Sand/Badlands", "Tall Grass", "Snow", "Water", "Volcano", "Burial Grounds", "Soaring", "Space" ];

export class Battle {
    id;
    ownerId;
    teams = [];
    rules;
    started = false;

    trainers = new Map();
    trainersByPnum = new Map();
    awaitingChoices = new Map();

    weather;

    getNumPlayersNeeded() {
        return this.rules.numTeams * this.rules.numTrainersPerTeam - this.trainers.size;
    }
}

export class BattleRules {
    generation;
    battleType;
    numTeams;
    numTrainersPerTeam;
    numPokemonPerTrainer;
    sendType;
    teamType;
    startingWeather = null;
    startingTerrain = null;
    ohkoClause = true;
    accClause = true;
    evaClause = true;
    sleepClause = true;
    freezeClause = true;
    speciesClause = true;
    itemsAllowed = false;
    itemClause = true;
    megasAllowed = true;
    zmovesAllowed = true;
    dynamaxAllowed = true;
    teraAllowed = true;
    worldCoronationClause = true;
    legendsAllowed = true;
    randomClause = false;
    inversionClause = false;
    skyClause = false;
    gameboyClause = false;
    wonderLauncherClause = false;
    rentalClause = true;
}

export class BattleIdCollisionError extends Error {}