import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

function Header(props) {
  return (
    <View style = {styles.headerView}>
        <MaterialCommunityIcons name = {props.iconEsq} size = {28} style = {styles.iconEsq} color={props.colorEsq} onPress = {props.onPressEsq} />
        <Text style = {styles.textHeader} >{props.title}</Text>
        <MaterialCommunityIcons name = {props.iconDir} size = {28} style = {styles.iconDir} color={props.colorDir} onPress = {props.onPressDir} />
    </View>
  )
};

const styles = StyleSheet.create({
    headerView: {
        padding:8,
        flexDirection:'row',
        alignContent:'space-around',
        alignItems:'center',
        justifyContent:'space-around',
        backgroundColor:'#123456',
        height: 60,
        elevation:5,
    },
    textHeader: {
        color: "#cccccc",
        fontWeight:'bold',
        fontSize:20,
        width:'80%',
        textAlign:'center',
    },
    iconEsq: {
        //position:'absolute',
        //color: '#cccccc',
        //left:16,
        width: "10%",
    },
    iconDir: {
        //position:'absolute',
        //color: '#cccccc',
        //left:355,
        width: "10%",
    },
});

export default Header
