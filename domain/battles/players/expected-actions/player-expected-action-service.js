export class PlayerExpectedActionService {
    create(room, playerId, actionType) {
        room.expectedActions.set(playerId, action);
    }

    del(room, playerId) {
        room.expectedActions.delete(playerId);
    }
}

export class PlayerExpectedAction {
    actionType;
}