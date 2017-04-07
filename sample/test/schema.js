
import {
    Map,
    List,
} from 'immutable';

export const UserEntity = Map({
    id: "_",
    username: "",
    age: 0,
    cars: List(),
    settings: Map({
        openDoor: true,
        allowPush: false,
    }),
});

UserEntity.realmSchema = {
    name: "User",
    primaryKey: "id",
    properties: {
        id: "string",
        username: "string",
        age: "int",
        cars: "list",
        settings: "map",
    },
};

export const schema = Map({
    userByID: Map(),
});