import React from 'react'
import {View , StyleSheet, Text, TouchableWithoutFeedback} from 'react-native'

function HomeMenu(props) {
  return (
    <View style = {styles.viewMenu}>
      <TouchableWithoutFeedback onPress={props.onPressEsq} disabled={props.disableEsq}>

        <View style = {{backgroundColor:props.disableEsq?'#dfdfdf':'#fdfdfd', width: '50%', alignItems:'center',
                                    justifyContent:'center', padding: 5,elevation:4,}} >
            
          <Text style = {{fontWeight:props.fontWeightEsq}}>{props.menuEsq}</Text>
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={props.onPressDir} disabled={props.disableDir}>

        <View style = {{backgroundColor:props.disableDir?'#dfdfdf':'#fdfdfd', width: '50%', alignItems:'center',
                                    justifyContent:'center', padding: 5 ,elevation:4,}} >

          <Text style = {{fontWeight:props.fontWeightDir}}>{props.menuDir}</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
};

const styles = StyleSheet.create({
    viewMenu: {
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'space-around',
    },
});
  

export default HomeMenu
