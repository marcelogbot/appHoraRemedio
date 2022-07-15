import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Text, SafeAreaView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

function Header(props) {
  return (
    <SafeAreaView style = {styles.headerView}>
        <MaterialCommunityIcons name = {props.iconEsq} size = {30} style = {styles.iconEsq} onPress = {props.onPressEsq} />
        <Text style = {styles.textHeader} >{props.title}</Text>
        <MaterialCommunityIcons name = {props.iconDir} size = {30} style = {styles.iconDir} onPress = {props.onPressDir} />
    </SafeAreaView>
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
        color: '#cccccc',
        //left:16,
        width: "10%",
    },
    iconDir: {
        //position:'absolute',
        color: '#cccccc',
        //left:355,
        width: "10%",
    },
});

export default Header
