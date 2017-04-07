
import {
    Map,
    List,
} from 'immutable';

export const UserEntity = Map({
    id: "_",
    username: "",
    age: 0,
    cars: List(),
});

UserEntity.realmSchema = {
    name: "User",
    primaryKey: "id",
    properties: {
        id: "string",
        username: "string",
        age: "int",
        cars: "list",
    },
};

export const schema = Map({
    userByID: Map(),
});