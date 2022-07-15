import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import Header from '../componentes/Header'

function Alt_Med(props) {

  const medicamento = props.route.params.medicamento

  return (
    <View style = {styles.viewStyle}>
      <Header title = {'Alterar Medicamento'} iconEsq={'chevron-left'} onPressEsq={() => props.navigation.navigate('Detalhes',{key:medicamento.id})}/>
      <Text>{JSON.stringify(medicamento)}</Text>
      
    </View>
  )
}

const styles = StyleSheet.create({
  viewStyle: {
      flex: 1,
      backgroundColor:'#cccccc',
  },
});

export default Alt_Med
