import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './src/pages/Home'
import Cad_Med from './src/pages/Cad_Med'
import Det_Med from './src/pages/Det_Med'
import Alt_Med from './src/pages/Alt_Med'


const Stack = createStackNavigator()

function App() {

  function focus(screen) {

    switch (screen) {
      case 'Início':
        //fazer algo
        break;
      case 'Cadastro':
        //fazer algo
        break;
      case 'Alterar':
        //fazer algo
        break;
      case 'Detalhes':
        //fazer algo
        break;
    }
  }

  return (
    <View  style={styles.container}>
      <StatusBar style='light' backgroundColor='#123456'/>
      <Stack.Navigator initialRouteName='Início' detachInactiveScreens = {false}
      screenListeners={{
        state: (e) => {
          // Do something with the state
          const routes = e.data['state']['routes']
          focus(routes[routes.length -1]['name'])
        },
      }}>
        <Stack.Group>
          <Stack.Screen name = 'Início' component={Home} options={{headerShown:false, animationEnabled:false}}/>
          <Stack.Screen name = 'Cadastro' component={Cad_Med} options={{headerShown:false, animationEnabled:false,}} />
          <Stack.Screen name = 'Detalhes' component={Det_Med} options={{headerShown:false, animationEnabled:false,}} />
          <Stack.Screen name = 'Alterar' component={Alt_Med} options={{headerShown:false, animationEnabled:false,}} />
        </Stack.Group>
      </Stack.Navigator>
    </View >
  );
}
export default() => {
  return (
    <NavigationContainer>
      <App/>
    </NavigationContainer>
  )
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:Constants.statusBarHeight,
  },
});
