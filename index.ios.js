/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import store from './sample/store'

import {
  UserEntity,
} from './sample/test/schema'

import {
  updateUser,
} from './sample/test/action'

import RealmRobot from './src/RealmRobot'

export default class realmImmutableRedux extends Component {

  robot = null

  constructor(props) {
    super(props);
    this.state = {};
    this.initRealmRobot();
  }

  initRealmRobot() {
    this.robot = new RealmRobot(store, {});
    this.robot.link(["test", "userByID"], UserEntity);
    this.robot.start();
  }

  componentDidMount() {
    store.subscribe(() => {
      this.setState({
        user: store.getState().getIn(["test", "userByID", "10"]),
      });
    });
    this.setState({
      user: store.getState().getIn(["test", "userByID", "10"]),
    });
  }

  render() {
    if (this.state.user === undefined) {
      return (
        <View style={styles.container}>
          <TouchableOpacity onPress={() => {
            store.dispatch(updateUser(UserEntity.set("id", "10").set("username", "Pony").set("age", 18)));
          }}>
            <Text style={styles.instructions}>Add User</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            this.robot.requestData(UserEntity, "10");
          }}>
            <Text style={styles.instructions}>Request User</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={styles.container}>
        <Text style={styles.instructions}>
          {this.state.user.get("username")}
        </Text>
        <TouchableOpacity onPress={() => {
          store.dispatch(updateUser(UserEntity.set("id", "10").set("username", "UED").set("age", 24)));
        }}>
          <Text style={styles.instructions}>Change User</Text>
        </TouchableOpacity>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('realmImmutableRedux', () => realmImmutableRedux);