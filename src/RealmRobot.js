
const Realm = require('realm');

const REALM_UDPATE_STATE = "REALM_UDPATE_STATE"

import {
    List,
} from 'immutable'

function convertImmutableAsObject(value, schema) {
    let object = value.toObject();
    for (let aKey in object) {
        if (object[aKey] instanceof List) {
            if (schema.properties[aKey] === "list") {
                object[aKey] = JSON.stringify(object[aKey].toArray());
            }
        }
    }
    return object;
}

function convertObjectAsImmutable(object, schemaEntity) {
    return schemaEntity.withMutations((newEntity) => {
        for (var aKey in schemaEntity.realmSchema.properties) {
            if (schemaEntity.realmSchema.properties[aKey] === "list") {
                newEntity.set(aKey, List(JSON.parse(object[aKey])));
            }
            else {
                newEntity.set(aKey, object[aKey]);
            }
        };
    });
}

export default class RealmRobot {

    static shouldReduce(mod, state, action) {
        return action.type === REALM_UDPATE_STATE && action.payload.mod === mod;
    }

    static reduce(mod, state, action) {
        const { keyPath, primaryKey, items } = action.payload;
        return state.withMutations(newState => {
            items.forEach(item => {
                newState.setIn(keyPath.shift().push(item.get(primaryKey)), item);
            });
        });
    }

    /**
     * Redux Store Instance
     */
    store = null;

    /**
     * Realm Instance
     */
    realm = null;

    /**
     * Realm init params
     */
    realmParams = {};

    /**
     * Stub
     */
    links = [];

    /**
     * Stub
     */
    oldState = null;

    /**
     * Stub
     */
    updateLock = false;

    constructor(store, realmParams) {
        this.store = store;
        this.realmParams = realmParams;
    }

    link(keyPath, schemaEntity) {
        this.links.push({
            keyPath: List(keyPath),
            schemaEntity,
        })
    }

    start() {
        this.realm = new Realm(Object.assign({
            schema: this.links.map((element) => {
                let elementSchema = {
                    name: element.schemaEntity.realmSchema.name,
                    primaryKey: element.schemaEntity.realmSchema.primaryKey,
                    properties: { ...element.schemaEntity.realmSchema.properties },
                };
                for (var aKey in elementSchema.properties) {
                    if (elementSchema.properties[aKey] === "list") {
                        elementSchema.properties[aKey] = "string";
                    }
                }
                return elementSchema;
            })
        }, this.realmParams));
        this.setupObserver();
    }

    stop() {
        this.observer && this.observer();
    }

    setupObserver() {
        this.oldState = this.store.getState();
        this.observer = this.store.subscribe(() => {
            if (this.updateLock === true) {
                return;
            }
            const newState = this.store.getState();
            this.realm.write(() => {
                this.links.forEach((link) => {
                    const { keyPath, schemaEntity } = link;
                    const oldValues = this.oldState.getIn(keyPath);
                    const newValues = newState.getIn(keyPath);
                    if (newValues === undefined || newValues.equals(oldValues)) {
                        return;
                    }
                    newValues.forEach((value, primaryKey) => {
                        if (oldValues === undefined) {
                            this.realm.create(schemaEntity.realmSchema.name, convertImmutableAsObject(value, schemaEntity.realmSchema), true);
                        }
                        else if (oldValues.get(primaryKey) !== undefined) {
                            if (!oldValues.get(primaryKey).equals(value)) {
                                this.realm.create(schemaEntity.realmSchema.name, convertImmutableAsObject(value, schemaEntity.realmSchema), true);
                            }
                        }
                        else {
                            this.realm.create(schemaEntity.realmSchema.name, convertImmutableAsObject(value, schemaEntity.realmSchema), true);
                        }
                    });
                })
                this.oldState = newState;
            });
        });
    }

    requestData(schemaEntity, value) {
        if (value === undefined || (value instanceof Array && value.length == 0)) {
            return;
        }
        this.updateLock = true;
        let rows = null;
        if (value instanceof Array) {
            rows = this.realm.objects(schemaEntity.realmSchema.name).filtered(value.map(it => {
                return schemaEntity.realmSchema.primaryKey + ' = "' + it + '"'
            }).join(" OR "));
        }
        else {
            rows = this.realm.objects(schemaEntity.realmSchema.name).filtered(schemaEntity.realmSchema.primaryKey + ' = "' + value + '"');
        }
        this.links.forEach(link => {
            if (link.schemaEntity.equals(schemaEntity)) {
                this.store.dispatch({
                    type: REALM_UDPATE_STATE,
                    payload: {
                        mod: link.keyPath.get(0),
                        keyPath: link.keyPath,
                        primaryKey: schemaEntity.realmSchema.primaryKey,
                        items: rows.map(row => {
                            return convertObjectAsImmutable(row, schemaEntity);
                        }),
                    }
                });
            }
        })
        this.updateLock = false;
    }

}