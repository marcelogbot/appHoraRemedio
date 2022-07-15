import React, { Component } from 'react'
import {Text, View, Animated, TouchableOpacity, StyleSheet } from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import LottieView from 'lottie-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {LogBox} from "react-native";

LogBox.ignoreLogs([
"ViewPropTypes will be removed",
"ColorPropType will be removed",
])

class RowAnimated extends Component {

    constructor(props) {
        super(props);
        this.swipeableRow = React.createRef(null);
        this.animatedCheck = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);
        this.animatedScale = new Animated.Value(0);
        this.checked = React.createRef(null);
      };

    componentDidMount() {
      Animated.parallel([
        Animated.timing(this.animatedOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(this.animatedScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();

    };

    onCheck = () => {
        const { onCheck } = this.props;
        if (onCheck) {
          this.checked.current?.play(60,0)
          Animated.sequence([
            Animated.timing(this.animatedCheck, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true
            }),
            Animated.timing(this.animatedCheck, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.parallel([
              Animated.timing(this.animatedCheck, {
                toValue: 0,
                duration: 900,
                useNativeDriver: true
              }),
              Animated.timing(this.animatedOpacity, {
                toValue: 0,
                duration: 900,
                useNativeDriver: true
              }),
            ]),
            Animated.timing(this.animatedOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true
            }),
          ]).start(() => onCheck());
        }  
      };

    leftAction(progress, dragX) {
      const scale = dragX.interpolate({
          inputRange:[0,100],
          outputRange:[0,1],
          extrapolate:'clamp'
      })
      const opacity = dragX.interpolate({
          inputRange:[0,100],
          outputRange:[0,1],
          extrapolate:'clamp'
      })
      return (
          <Animated.View style = {[styles.leftActionStyle,{opacity:opacity}]}>
          <Animated.Text style = {[{fontWeight:'bold', color:'#cccccc', fontSize:20},{transform:[{scale:scale}]}]}>
              Marcar como 'Tomei!'
          </Animated.Text>
          </Animated.View>
      );
    };

    handleLeft = () => {
      const { handleLeft } = this.props;
      handleLeft()
      this.swipeableRow.current.close()
    };


  render() {
    
    return (
      
      <Swipeable 
        ref={this.swipeableRow}
        renderLeftActions={this.leftAction}
        onSwipeableOpen={this.handleLeft}
        friction={2}
        leftThreshold={80}
      >

        <Animated.View style = {[styles.cardStyle,{opacity:this.animatedOpacity},{transform:[{scale:this.animatedScale}]}]}>
          <TouchableOpacity style={{flexDirection:'row', alignItems:'center', justifyContent:'space-around'}} 
              activeOpacity={0.8} 
              onPress={this.props.onPressCard} >
            <TouchableOpacity activeOpacity ={1} style = {[styles.check]} onPress={this.onCheck}>
              <MaterialCommunityIcons name={'checkbox-blank-circle-outline'} size={30} />
              <LottieView 
                  ref={this.checked}
                  style={{height:78, width:78, position:'absolute', left:-12, zIndex:10}}
                  source={require('../assets-comp/lottie/checkmark-animation.json')} 
                  autoPlay={false} 
                  loop={false}/>
              <Animated.View style = {{backgroundColor:'#1E5E93',borderRadius:5,
                                        position:'absolute', elevation:10, left:30,
                                        zIndex:9, opacity:this.animatedCheck}}>
                  <Text style={{fontStyle:'italic', color:'#cccccc',fontSize:18, padding:10, fontWeight:'bold'}}>Tomei!</Text>
              </Animated.View>
            </TouchableOpacity>
            <View style={{width:'80%'}}>
                {this.props.children}
            </View>
            <MaterialCommunityIcons name='chevron-right' size={30} style = {{width:'10%'}} />
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  cardStyle: {
    flex: 1,
    flexDirection:'row',
    padding:10,
    elevation:5,
    marginTop:3,
    width: '98%',
    backgroundColor:'#eeeeee',
    borderRadius:5,
    left:4,
  },
  leftActionStyle: {
    flexDirection:'row',
    padding:10,
    elevation:3,
    marginTop:3,
    width: '100%',
    backgroundColor:'#1E5E93',
    borderRadius:5,
    left:4,
    alignItems:'center',
    justifyContent:'flex-start',
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '10%',
    zIndex:10,

  },
});

export default RowAnimated
