import React, {useState, useEffect, useRef} from 'react'
import {View, Text , StyleSheet, Alert, ScrollView, Modal, TextInput, Pressable, Dimensions, FlatList, TouchableOpacity} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../componentes/Header'
import moment from 'moment'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import  {GestureDetector, Gesture, GestureHandlerRootView} from 'react-native-gesture-handler'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

function Det_Med(props) {
  const key = props.route.params.key;

  const [medicamento,setMedicamento] = useState({});
  const [showModalEditAnotacao,setShowModalEditAnotacao] = useState(false);
  const [anotacaoUpdate, setAnotacaoUpdate] = useState('')
  const textInputAnotacaoRef = useRef(null)

  const contextY = useSharedValue({y:0})
  const translateY = useSharedValue(0)
  const heightButton = useSharedValue(0)

  const getItem = async () => {

    try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          //We have data!!
          const parseJsonValue = JSON.parse(value);
          setMedicamento(parseJsonValue);
          setAnotacaoUpdate(parseJsonValue.anotacao)
        };
  
      } catch (e) {
        // read key error
        Alert.alert(
          "Erro ao recuperar dados",
          "Erro: " + e
        );
      };
  };
 
  const updateAnotacao = async () => {
    try {
      const jsonValue = JSON.stringify({anotacao: anotacaoUpdate})
      await AsyncStorage.mergeItem(medicamento.id, jsonValue)
      await getItem()

    } catch (e) {
      // saving error
      Alert.alert(
        "Erro ao Salvar",
        "Erro: " + e
      )
    };
    setShowModalEditAnotacao(false)
  };

  function mostraHistorico() {

    heightButton.value = withSpring(0, {damping:50})
    translateY.value = withSpring(0, {damping:50})
   
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = {y:translateY.value}
    })
    .onUpdate((event) => {
      if(translateY.value>= 0){
        translateY.value = event.translationY + contextY.value.y;
      }       
    })
    .onEnd(() => {
      if(translateY.value >= 150) {
        translateY.value = withSpring(800, {damping:50})
        heightButton.value = withSpring(50, {damping:50})
      } else {
        translateY.value = withSpring(0, {damping:50})
      }
    });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [{translateY: translateY.value}],
      }
    });

    const rButtonAlterarStyle = useAnimatedStyle(() => {
      return {
        height: heightButton.value,
      }
    });

  useEffect(() => {
    getItem();
    translateY.value=800;
    heightButton.value=50;

  },[]);

  useFocusEffect(
    React.useCallback(() => {
      getItem();

      return () => {

      };
    }, [])
  );
  
  return (
    <View style = {[styles.viewStyle]}>
      <Header title = {'Detalhes'} iconEsq={'chevron-left'} colorEsq={'#cccccc'} onPressEsq={() => props.navigation.goBack()} />
      
      <View style={{justifyContent:'center', alignItems:'center', padding:5}}>

        <Text style={styles.nameMedStyle}>{medicamento.nome}</Text>
        <View style={styles.separador}/>

        <Text style={styles.labelText}>Duração do tratamento</Text>
        <Text style={styles.dadosMed}>{medicamento.duracao?medicamento.duracao.tratamentoContinuo?'Uso contínuo.':'Usar por '+medicamento.duracao.num+' '+medicamento.duracao.medidaTempo:""}</Text>

        <Text style={styles.labelText}>Frequência:</Text>
        <Text style={styles.dadosMed}>A cada {medicamento.frequencia?medicamento.frequencia.num+' '+medicamento.frequencia.medidaTempo.nome:''}</Text>

        <Text style={styles.labelText}>Iniciado em:</Text>
        <Text style={styles.dadosMed}>{moment(medicamento.dataInicio).format('DD/MM/YYYY [às] HH:mm')}</Text>

        <View style={styles.separador}/>

      </View>

      <View style={styles.anotacaoView}>
          <View style={styles.labelAnotacaoView}>
            <Text style={styles.labelAnotacao}>Anotações:</Text>
            <MaterialCommunityIcons name={'note-edit-outline'} color={'#555555'} size={28} onPress={() => setShowModalEditAnotacao(true)}/>
          </View>

          <ScrollView style={styles.anotacaoContentView}>
            <Text style={styles.anotacaoText}>{medicamento.anotacao}</Text>
          </ScrollView>
      </View>

      <Modal 
        visible={showModalEditAnotacao}
        transparent={true}
        animationType={'fade'}
        onRequestClose = {() => setShowModalEditAnotacao(false)}
        >

        <View style={{flex:1, backgroundColor:'rgba(256,256,256,0.7)', justifyContent:'center'}}>
          <View style={{position:'absolute', alignSelf:'center', backgroundColor:'#eeeeee', width:'98%', bottom:0,
                        borderTopLeftRadius:10, borderTopRightRadius:10}}
          >
            <View style={{padding:10}}>
              <TextInput style = {{backgroundColor:'#fffefe', padding:10, borderRadius:4, height:300, 
                                    textAlign:'left', textAlignVertical:'top', fontSize:18}}
              placeholder='Inclua suas anotações.'
              multiline = {true}
              value={anotacaoUpdate}
              maxLength={120}
              onChangeText = {(text) => setAnotacaoUpdate(text)}
              clearButtonMode="while-editing"
              scrollEnabled={true}
              ref={textInputAnotacaoRef}
              autoFocus={true}
              />
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'baseline'}}>
              <Pressable style={[{backgroundColor:'#D64E31'},styles.button]}
                        onPress={() => setShowModalEditAnotacao(false)}>
                <Text style={{color:'#eeeeee', fontWeight:'bold', fontSize:20}}>Cancelar</Text>
              </Pressable>
              <Pressable style={[{backgroundColor:'#123456'},styles.button]}
                                onPress={() => updateAnotacao()}>
                <Text style={{color:'#eeeeee', fontWeight:'bold', fontSize:20}}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
        
      </Modal>

      <Pressable
            style={[styles.buttonHistorico,{backgroundColor:'#123456'}]}
            onPress={() => mostraHistorico()}>
            <Text style={styles.buttonHistoricoText}>Ver histórico de lembretes</Text>
      </Pressable>

      <GestureHandlerRootView style={{flex:1,justifyContent:'center', alignItems:'center'}}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{padding:10, height: SCREEN_HEIGHT*0.9, width:'95%',
                                  backgroundColor:'#dddddd', borderTopLeftRadius:10, borderTopRightRadius:10, position:'absolute',
                                  bottom:SCREEN_HEIGHT/SCREEN_HEIGHT, justifyContent:'center', elevation:10,
                                  zIndex:1},
                                  rBottomSheetStyle]}
          >
        
              <View style={{width:'100%', justifyContent:'center', alignItems:'center'}}>
                  <View style={{backgroundColor:'#444444', margin:8 ,height:5, width:60, borderRadius:15}}/>
                  <Text style={{fontSize:18, color:'#333333', fontWeight:'bold'}}>Histórico de Lembretes - Total de {medicamento.lembretes ? medicamento.lembretes.length : 0}</Text>
                  <View style={{backgroundColor:'#aaaaaa', height:1.5, width:'95%'}}/>
              </View>
              <FlatList
                  style={{padding:5, margin:5, marginBottom:10}}
                  data={medicamento.lembretes}
                  renderItem = {({item}) => {
                      if (item.concluido) {
                          return (
                              <View style={{marginBottom:4}}>
                                  <Text style={{fontWeight:'bold'}}>Dose: {item.id} - Ok</Text>
                                  <Text style={{fontSize:16, color:'#333333'}}>Previsto: {moment(item.dataLembrete).format('HH:mm [-] DD/MM/YYYY')}</Text>
                                  <Text style={{fontSize:18, color:'#123456'}}>Tomei: {moment(item.dataConcluido).format('HH:mm [-] DD/MM/YYYY')}</Text>
                              </View>
                          )
                      } else {
                          return (
                              <View style={{marginBottom:4}}>
                                  <Text style={{fontWeight:'bold'}}>Dose: {item.id}</Text>
                                  <Text style={{fontSize:16, color:'#333333'}}>Previsto: {moment(item.dataLembrete).format('HH:mm [-] DD/MM/YYYY')}</Text>
                                  <Text style={{fontSize:18, color:'#D27305', fontStyle:'italic'}}>Ainda não tomei</Text>
                              </View>
                          )
                      }
                  }}
                  keyExtractor={(item , index) => item.id}
              />
      
          </Animated.View>
        </GestureDetector>  
      </GestureHandlerRootView>  

      <Animated.View style={[rButtonAlterarStyle,{flexDirection:'row',backgroundColor:'#123',
                                justifyContent:'center', alignItems:'center', padding:5, elevation:0,
                                position:'absolute',bottom:0, width:'100%', zIndex:1}]}>
          <TouchableOpacity
              Pressable={!showModalEditAnotacao}
              onPress = {() => props.navigation.navigate('Alterar',{medicamento:medicamento})}
              style={{flexDirection:'row', alignItems:'center'}}>
                <MaterialCommunityIcons name={'file-document-edit-outline'} color={'#dddddd'} size={24}/>
                <Text numberOfLines={1} style = {{fontSize:22, color:'#dddddd'}} >{' '}Editar medicamento</Text>
          </TouchableOpacity>
        </Animated.View> 
     
    </View>
)
};

const styles = StyleSheet.create({
 viewStyle: {
     flex: 1,
     backgroundColor:'#cccccc',
 },
 labelText: {
      fontSize:18, 
      color:'#333333', 
      marginTop:10
 },
 nameMedStyle: {
      fontSize:30, 
      color:'#123456', 
      fontWeight:'bold', 
      padding:0, 
      marginTop:0
 },
 separador: {
      backgroundColor:'#aaaaaa', 
      height:1.5, 
      width:'95%', 
      margin:5
 },
 dadosMed: {
      fontSize:20, 
      color:'#333333', 
      fontWeight:'bold'
 },
 anotacaoView: {
      backgroundColor:'#dddddd', 
      padding:5, 
      marginHorizontal:10, 
      borderRadius:5,
 },
 labelAnotacaoView: {
      flexDirection:'row', 
      justifyContent:'space-between', 
      alignItems:'center'
 },
 labelAnotacao: {
      fontSize:18, 
      color:'#555555', 
      textDecorationLine:'underline'
 },
 anotacaoContentView: {
      height:'20%', 
      backgroundColor:'#dedede', 
      paddingHorizontal:5, 
      marginTop:3
 },
 anotacaoText: {
      fontSize:18, 
      color:'#333333', 
      marginTop:5
 },
 button: {
  borderRadius: 5,
  padding: 5,
  elevation: 4,
  margin:10,
  width: '45%',
  justifyContent:'center', 
  alignItems:'center',
},
buttonHistorico: {
  borderRadius: 5,
  padding: 10,
  elevation: 4,
  margin:10,
  justifyContent:'center', 
  alignItems:'center',
},
buttonHistoricoText: {
  fontSize:18,
  fontWeight:'bold',
  textAlign:'center',
  color:'#cccccc',
},

});

export default Det_Med
