export const GENERATIONS = [ "Standard"/*, "GSC", "RSE", "XY", "SM", "SwSh", "SV"*/ ];
export const BATTLE_TYPES = [ "Singles"/*, "Doubles", "FFA "*/];
export const SEND_TYPES = [ "Public", "Private" ];
export const TEAM_TYPES = [ /*"Open",*/ "Full", "Preview" ];
export const STARTING_WEATHERS = [ "None", "Rain", "Sun", "Hail", "Snow", "Sandstorm", "Fog" ];
export const STARTING_TERRAINS = [ "Building", "Cave", "Ice", "Puddles", "Sand/Badlands", "Tall Grass", "Snow", "Water", "Volcano", "Burial Grounds", "Soaring", "Space" ];

export class Battle {
    id;
    ownerId;
    playerIds = [];
    teams = [];
    rules;
    started = false;

    getNumPlayersNeeded() {
        return this.rules.numTeams * this.rules.numTrainersPerTeam - this.playerIds.length;
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
    legendsAllowed = true;
    worldCoronationClause = true;
    randomClause = false;
    inversionClause = false;
    skyClause = false;
    gameboyClause = false;
    wonderLauncherClause = false;
    rentalClause = false;
}

export class BattleIdCollisionError extends Error {}