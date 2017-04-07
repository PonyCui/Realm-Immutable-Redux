
import { schema } from './schema'

import {
    TEST_UDPATE_USER,
} from './action'

import RealmRobot from '../../src/RealmRobot'

export default (state = schema, action) => {
    if (RealmRobot.shouldReduce('test', state, action) === true) {
        return RealmRobot.reduce('test', state, action);
    }
    switch (action.type) {
        case TEST_UDPATE_USER:
            return state.withMutations((newState) => {
                newState.setIn(["userByID", action.payload.userEntity.get("id")], action.payload.userEntity);
            });
        default:
            return state;
    }
}