
const Realm = require('realm');

const REALM_UDPATE_STATE = "REALM_UDPATE_STATE"

import {
    List,
} from 'immutable'

export default class RealmRobot {

    static shouldReduce(mod, state, action) {
        return action.type === REALM_UDPATE_STATE && action.payload.mod === mod;
    }

    static reduce(mod, state, action) {
        const { keyPath, pkValue, newValue } = action.payload;
        return state.setIn(keyPath.shift().push(pkValue).toArray(), newValue);
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
                return element.schemaEntity.realmSchema;
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
                            this.realm.create(schemaEntity.realmSchema.name, value.toObject(), true);
                        }
                        else if (oldValues.get(primaryKey) !== undefined) {
                            if (!oldValues.get(primaryKey).equals(value)) {
                                this.realm.create(schemaEntity.realmSchema.name, value.toObject(), true);
                            }
                        }
                        else {
                            this.realm.create(schemaEntity.realmSchema.name, value.toObject(), true);
                        }
                    });
                })
                this.oldState = newState;
            });
        });
    }

    requestData(schemaEntity, value) {
        this.updateLock = true;
        const rows = this.realm.objects(schemaEntity.realmSchema.name).filtered(schemaEntity.realmSchema.primaryKey + ' = "' + value + '"');
        if (rows.length > 0) {
            const row = rows[0];
            const entity = schemaEntity.withMutations((newEntity) => {
                for (var aKey in schemaEntity.realmSchema.properties) {
                    newEntity.set(aKey, row[aKey]);
                };
            });
            this.links.forEach(link => {
                if (link.schemaEntity.equals(schemaEntity)) {
                    this.store.dispatch({
                        type: REALM_UDPATE_STATE,
                        payload: {
                            mod: link.keyPath.get(0),
                            keyPath: link.keyPath,
                            pkValue: value,
                            newValue: entity,
                        }
                    })
                }
            })
        }
        this.updateLock = false;
    }

}