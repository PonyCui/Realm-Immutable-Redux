
import {
    createStore,
} from 'redux'

import {
    combineReducers
} from 'redux-immutable'

import {
    Map,
} from 'immutable'

import testReducer from './test/reducer'

export default store = createStore(combineReducers({
    test: testReducer,
}), Map({}));