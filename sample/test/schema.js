
import {
    Map
} from 'immutable';

export const UserEntity = Map({
    id: "_",
    username: "",
    age: 0,
});

UserEntity.realmSchema = {
    name: "User",
    primaryKey: "id",
    properties: {
        id: "string",
        username: "string",
        age: "int",
    },
};

export const schema = Map({
    userByID: Map({
        "_": UserEntity,
    }),
});