import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, FlatList, 
        SafeAreaView, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import moment from 'moment'
import Header from '../componentes/Header'
import HomeMenu from '../componentes/HomeMenu'
import RowAnimated from '../componentes/RowAnimated'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function Home(props) {

  //Dados cadastro de notificação
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  //Dados lembretes medicamentos
  const [medicamentos,setMedicamentos] = useState([]);
  const [lembretesList, setLembretesList] = useState([]);
  const [filtro,setFiltro] = useState('');
  const [loading, setIsLoading] = useState(false);
  const [menuDir,setMenuDir] = useState('normal');
  const [menuEsq,setMenuEsq] = useState('bold');
  const [selectedDir,setSelectedDir] = useState(false);
  const [selectedEsq,setSelectedEsq] = useState(true);

  const menuChange = (menu) => {
  
      if (menu == 'menuEsq') {
          setMenuDir('bold');
          setMenuEsq('normal');
          setSelectedEsq(true);
          setSelectedDir(false);

      } else {
          setMenuDir('normal');
          setMenuEsq('bold');
          setSelectedEsq(false);
          setSelectedDir(true);

      };

      setFiltro('');
  };

  const confirmClearAll = () => {
      Alert.alert(
          "Limpar Registros",
          "Tem certeza que deseja apagar todos os medicamentos? ",
          [{
          text: 'Cancelar',
          style:'cancel',
          },
          {
          text:'Tenho certeza!',
          onPress: () => clearAll()},]
      )
  };

  const clearAll = async () => {
      try {
        await AsyncStorage.clear()
        await Notifications.cancelAllScheduledNotificationsAsync()
        loadData()
      } catch(e) {
        // clear error
      }
  };
  
  async function loadData() {
      
    setIsLoading(true);

      try {

        let keys = [];
        keys = await AsyncStorage.getAllKeys();
        console.log('Total de Chaves = '+ keys.length);

        let values;
        values = await AsyncStorage.multiGet(keys);
        console.log('Total de Dados = '+ values.length);
        
        let sortMed = []
        for (let i=0; i<values.length; i++) {
          sortMed.push(JSON.parse(values[i][1]))
        };

       sortMed = sortMed.sort((a,b) => a.nome - b.nome);

       console.log(sortMed);

        let proxList = [];
        for(let i =0; i<sortMed.length; i++) {
          for(let n = 0; n<sortMed[i].lembretes.length; n++) {
            if (!sortMed[i].lembretes[n].concluido) {
              proxList.push(sortMed[i].lembretes[n])
            }
          }
        };

        setMedicamentos(sortMed);
        setLembretesList(proxList);
  
      } catch (e) {
        
        //read key error
        setIsLoading(false);
        Alert.alert(
          "Erro ao recuperar chaves",
          "Erro: " + e
        )
      };
      setIsLoading(false);
  };

  const concluirTask = async (medicamento,isConcluir,idLembrete) => {

    const idLembreteAtual = idLembrete;
    const dadosMedAtualizado = medicamento;
    const lembretesUpdate = medicamento.lembretes;
    const dataLembreteAtual = new Date(lembretesUpdate[idLembrete-1].dataLembrete);

    try {
      
      //Se a ação for de concluir entra no IF
      if(isConcluir){
        
        //Cancela notificação caso ainda esteja agendada
        if(lembretesUpdate[idLembreteAtual-1].idNotificacao != '' && dataLembreteAtual > new Date()) {
          let idNotificacao = lembretesUpdate[idLembreteAtual-1].idNotificacao
          await Notifications.cancelScheduledNotificationAsync(idNotificacao);
        };

        //Atualiza registro do lembrete para concluído
        lembretesUpdate[idLembreteAtual-1] = {
                              id: idLembreteAtual,
                              dataLembrete: new Date(dataLembreteAtual),
                              concluido:isConcluir,
                              dataConcluido:new Date(),
                              idNotificacao: '',
                            };

        //Em caso de Tratamento Contínuo e não ter próximo lembrete criado, Rodar script para gerar novo lembrete
        if (lembretesUpdate.length == idLembreteAtual && dadosMedAtualizado.duracao.tratamentoContinuo) {

          //gerando novo lembrete caso não tenha horários específicos definidos
          if (dadosMedAtualizado.frequencia.horarios.length == 0) {

            let freqHoras = 0;

            switch (dadosMedAtualizado.frequencia.medidaTempo.id) {
              case 'h':
                freqHoras = dadosMedAtualizado.frequencia.num;
                console.log('frequencia em horas!')
                break;
              case 'd':
                freqHoras = dadosMedAtualizado.frequencia.num*24;
                console.log('frequencia em dias!')
                break;
              case 's':
                freqHoras = dadosMedAtualizado.frequencia.num*(24*7);
                console.log('frequencia em semanas!')
                break;
              case 'm':
                freqHoras = 0 //repetir o mesmo dia de início a cada mês 
                console.log('frequencia em meses!')
                break;
            };

            const dataNovoLembrete = new Date(dataLembreteAtual);
            dataNovoLembrete.setHours(dataNovoLembrete.getHours()+freqHoras,dataNovoLembrete.getMinutes(),0,0)
                        
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Hora do remédio!',
                body: 'Tomar o ' + dadosMedAtualizado.nome.trim() + ' às ' + moment(dataNovoLembrete).format('HH:mm [-] DD/MM/YY'),
              },
              trigger: {date: new Date(dataNovoLembrete)},
            });
            let novoId = idLembreteAtual+1
            lembretesUpdate.push({id:novoId, 
                                  dataLembrete:new Date(dataNovoLembrete), 
                                  concluido:false,
                                  dataConcluido:'', 
                                  idNotificacao:notificationId
                                });
            
          } //Caso tenha horários específicos e for tratamento contínuo 
          else if (dadosMedAtualizado.frequencia.horarios.length > 0) {
            
            for (let j =0; j < dadosMedAtualizado.frequencia.horarios.length; j++) {
      
              const dataNovoLembrete = new Date(dataLembreteAtual);
              dataNovoLembrete.setHours(dadosMedAtualizado.frequencia.horarios[j].hora,dadosMedAtualizado.frequencia.horarios[j].min,0,0);
              let novoId = idLembreteAtual+1

              if (j==0) {

                const notificationId = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'Hora do remédio!',
                    body: 'Tomar o ' + dadosMedAtualizado.nome.trim() + ' às ' + moment(dataNovoLembrete).format('HH:mm [-] DD/MM/YY'),
                  },
                  trigger: {date: new Date(dataNovoLembrete)},
      
                });
                lembretesUpdate.push({id:novoId,
                                dataLembrete:new Date(dataNovoLembrete),
                                concluido:false,
                                dataConcluido:'',
                                idNotificacao:notificationId});
      
              } else {
                lembretesUpdate.push({id:novoId,
                                dataLembrete:new Date(dataNovoLembrete),
                                concluido:false,
                                dataConcluido:'',
                                idNotificacao:''});
              };
              novoId++
            };
          };

        } //Caso já tenha o próximo lembrete já criado, cria só a notificação
        else if(lembretesUpdate.length > idLembreteAtual) {

          const dataProximoLembrete = new Date(lembretesUpdate[idLembreteAtual].dataLembrete)
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Hora do remédio!',
              body: 'Tomar o ' + dadosMedAtualizado.nome.trim() + ' às ' + moment(dataProximoLembrete).format('HH:mm [-] DD/MM/YY'),
            },
            trigger: {date: new Date(dataProximoLembrete)},

          });
          lembretesUpdate[idLembreteAtual] = {id:idLembreteAtual+1,
                                              dataLembrete:new Date(dataProximoLembrete),
                                              concluido:false,
                                              dataConcluido:'',
                                              idNotificacao:notificationId
                                            };          
        };

        //Prepara e atualiza registro no storage
        dadosMedAtualizado.lembretes = lembretesUpdate
        const mergeStorage = JSON.stringify(dadosMedAtualizado)
        await AsyncStorage.mergeItem(dadosMedAtualizado.id, mergeStorage)
        console.log('Lembrete Concluído com sucesso!')

      } //Em caso de reativar ou 'desconcluir' um lembrete 
      else {
        // se a data do lembrente for maior que a data atual, cria uma nova notificação
        if(new Date(dataLembreteAtual) > new Date()) {

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                        title: 'Hora do remédio!',
                        body: 'Tomar o ' + dadosMedAtualizado.nome.trim() + ' às ' + moment(dataLembreteAtual).format('HH:mm [-] DD/MM/YY'),
                      },
                        trigger: {date:new Date(dataLembreteAtual)},
          });

          lembretesUpdate[idLembreteAtual-1] =   {
                                                    id: idLembreteAtual,
                                                    dataLembrete:new Date(dataLembreteAtual),
                                                    concluido:isConcluir,
                                                    dataConcluido:'',
                                                    idNotificacao: notificationId,
                                                  };

        } else {
          
          lembretesUpdate[idLembreteAtual-1] =   {
                                                    id: idLembreteAtual,
                                                    dataLembrete:new Date(dataLembreteAtual),
                                                    concluido:isConcluir,
                                                    dataConcluido:'',
                                                    idNotificacao: '',
                                                  };
        };

        //Prepara e atualiza registro no storage
        dadosMedAtualizado.lembretes = lembretesUpdate
        const mergeStorage = JSON.stringify(dadosMedAtualizado)
        await AsyncStorage.mergeItem(dadosMedAtualizado.id, mergeStorage )
        console.log('Lembrete desconcluido com sucesso!')
      
      };

      loadData();
      
    } catch (e) {
      Alert.alert(
        "Erro ao concluir ou reativar lembrete!",
        "Erro: " + e
      );
    };
  };

  const SemLembrete = () => {
      if (lembretesList.length == 0 && selectedEsq) {
        return (
          <View style = {{alignItems:'center',justifyContent:'center', backgroundColor:'#222222', borderRadius:15, width:'90%',alignSelf:'center', top:10, elevation:5}}>
            <Text style = {{padding:20,fontSize:30, color:'#dddddd', textAlign:'center'}}>Você não tem lembretes!</Text>
            <Text style = {{padding:20,fontSize:20, color:'#dddddd', textAlign:'center'}}>Aqui serão listados os próximos lembretes de uso de seus medicamentos cadastrados!</Text>
          </View>
          )
      } else {
        return null
      }
  };

  const renderData = ({item,index}) => {

    const medicamento = item;
    const lembretesProximos = medicamento.lembretes.filter(lembrete => lembrete.concluido == false);
    const lembretesConcluidos = medicamento.lembretes.filter(lembrete => lembrete.concluido == true);
    console.log('Lembretes próximos: '+lembretesProximos.length+'\nLembretes concluídos: '+lembretesConcluidos.length);

    if (selectedEsq && lembretesProximos.length > 0) {

      const proximoLembrete = lembretesProximos.shift();
      const dataPL = new Date(proximoLembrete.dataLembrete);
      const labelDataPL = moment(dataPL).format('HH:mm [-] DD/MM/YY');

      return (
        
        <RowAnimated onCheck={() => concluirTask(medicamento,true,proximoLembrete.id)}
                    onPressCard={() => props.navigation.navigate('Detalhes',{key:medicamento.id})}
                    handleLeft={() => concluirTask(medicamento,true,proximoLembrete.id)}>
          <View>
            <Text numberOfLines={1} style = {{fontSize:22,color:'#222222'}} >{medicamento.nome}</Text>
                <Text numberOfLines={1} style = {{fontSize:14, color:dataPL <= new Date()?'#D33103':'#222222', fontWeight:'bold'}} >Próximo as: {labelDataPL} - {medicamento.duracao.tratamentoContinuo ? 'Contínuo': (lembretesConcluidos.length+1) + ' de ' + medicamento.lembretes.length } </Text>
          </View>
        </RowAnimated>
        
      );

    } else if (selectedDir && medicamento.id == filtro && lembretesConcluidos.length > 0) {

      console.log('concluidos')
      
      return (
        <View>
          <TouchableOpacity  style = {{backgroundColor:lembretesProximos.length>0?'#C8e8ef':'#C8D7DE', marginBottom:3, elevation:6, flexDirection:'row', alignItems:'center', justifyContent:'space-around'}}
                activeOpacity={0.8}
                onPress = {() => filtro == medicamento.id?setFiltro('') : setFiltro(medicamento.id)}>
                  <MaterialCommunityIcons name={'chevron-down'} size={20} style = {{width:'10%', marginLeft:15}}/>
                  <View style = {{width:'75%',flexDirection:'row'}}>
                    <Text numberOfLines={1} style = {{fontSize:18,marginLeft:0,padding:5,fontWeight:'bold', textDecorationLine:lembretesProximos.length>0?'none':'line-through'}} >{medicamento.nome}</Text>
                    <Text numberOfLines={1} style = {{fontSize:16,marginLeft:0,padding:5,fontWeight:'bold'}} >({lembretesConcluidos.length})</Text>
                  </View>
                  <MaterialCommunityIcons name={'information-variant'} size={26} style = {{width:'15%', marginLeft:15}} onPress={() => props.navigation.navigate('Detalhes',{key:medicamento.id})} />
              </TouchableOpacity>
                
          <FlatList
            style={{marginBottom:5}}
            data={lembretesConcluidos}
            onRefresh = {() => loadData()}
            refreshing = {loading}
            keyExtractor={(item,index) => item.id}
            renderItem={({ item , index}) => { 
                
              return (
                  <View style = {styles.cardStyleConcluido}>
                    <MaterialCommunityIcons name={'check-circle'} size={30} style = {{width:'10%',left:5}} onPress = {() => concluirTask(medicamento,false,item.id)} />
                    <TouchableOpacity style = {{marginLeft:10,width:'90%'}}
                      activeOpacity={0.8} >
                        <Text numberOfLines={1} style = {{fontSize:20}} >{item.id} - Tomei em:</Text>
                        <Text numberOfLines={1} style = {{fontSize:18,fontStyle:'italic', fontWeight:'bold'}} >{moment(item.dataConcluido).format('DD/MM/YYYY [às] HH:mm')}</Text>
                    </TouchableOpacity>
                  </View>
                );
            }}
          />
        </View>
      );

      } else {

        if (selectedEsq) {

          return null
  
        } else {

          return (
            <View>
              <TouchableOpacity  style = {{backgroundColor:lembretesProximos.length>0?'#C8e8ef':'#C8D7DE', marginBottom:3, elevation:6, flexDirection:'row', alignItems:'center', justifyContent:'space-around'}}
                activeOpacity={0.8}
                onPress = {() => filtro == medicamento.id?setFiltro('') : setFiltro(medicamento.id)}>
                  <MaterialCommunityIcons name={'chevron-right'} size={20} style = {{width:'10%', marginLeft:15}}/>
                  <View style = {{width:'75%',flexDirection:'row'}}>
                    <Text numberOfLines={1} style = {{fontSize:18,marginLeft:0,padding:5,fontWeight:'bold', textDecorationLine:lembretesProximos.length>0?'none':'line-through'}} >{medicamento.nome}</Text>
                    <Text numberOfLines={1} style = {{fontSize:16,marginLeft:0,padding:5,fontWeight:'bold'}} >({lembretesConcluidos.length})</Text>
                  </View>
                  <MaterialCommunityIcons name={'information-variant'} size={26} style = {{width:'15%', marginLeft:15}} onPress={() => props.navigation.navigate('Detalhes',{key:medicamento.id})} />
              </TouchableOpacity>
            </View>
          );
        };
      };
  };
  
  useEffect(() => { 

  //Configurando notificações
  registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    setNotification(notification);
  });
  responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    console.log(response);
  });
  
  return () => {
    Notifications.removeNotificationSubscription(notificationListener.current);
    Notifications.removeNotificationSubscription(responseListener.current);
  };

  },[])
  
  useFocusEffect(
      React.useCallback(() => {

      loadData();
      setMenuDir('bold');
      setMenuEsq('normal');
      setSelectedEsq(true);
      setSelectedDir(false);
  
      return () => {
        setMenuDir('bold');
        setMenuEsq('normal');
        setSelectedEsq(true);
        setSelectedDir(false);
  
      };
      }, [])
  );

  return (
    <SafeAreaView style = {styles.viewStyle}>
    <Header title={'Meus Medicamentos'} />
    <HomeMenu menuEsq = {'Próximos'} menuDir = {'Concluído'} disableDir={selectedDir} disableEsq = {selectedEsq}
      onPressDir={() => menuChange('menuDir')}
      onPressEsq={() => menuChange('menuEsq')}
      fontWeightDir = {menuDir}
      fontWeightEsq = {menuEsq}/>
    <SemLembrete/>
    <FlatList
            style = {{marginTop:3, marginBottom:5}}
            data = {medicamentos}
            renderItem = {renderData}
            onRefresh = {() => loadData()}
            refreshing = {loading}
            keyExtractor = {(item , index) => item.id}              
    />
    <TouchableOpacity style={{position:'absolute', backgroundColor:'#123456', height:60, width:60, borderRadius:30, bottom:60, right:20, padding:15, alignItems:'center', elevation:4 }}
                      onPress = {() => props.navigation.navigate('Cadastro')}>
      <MaterialCommunityIcons name={'plus'} color={'#dddddd'} size={30} />
    </TouchableOpacity>
    <TouchableOpacity style = {{backgroundColor:'#dddddd', justifyContent:'center', alignItems:'center', flexDirection:'row', padding:3}}
          onPress = {() => confirmClearAll()}>
      <MaterialCommunityIcons name={'trash-can-outline'} size={24}/>
      <Text numberOfLines={1} style = {{fontSize:22}} >Remover todos</Text>
    </TouchableOpacity>
  </SafeAreaView>

  )
};

const styles = StyleSheet.create({
  viewStyle: {
      flex: 1,
      backgroundColor:'#888888',
  },
  textStyle: {
      margin:10,
      padding: 10,
      color:'#ffffff',
      fontSize:20,
      fontStyle:'italic',
      fontWeight:'bold',
      textAlign:'center',    
  },
  cardStyleConcluido: {
    flexDirection:'row',
    padding:8,
    elevation:1.5,
    marginTop:3,
    width: '98%',
    backgroundColor:'#cccccc',
    borderRadius:5,
    left:4,
    alignItems:'center',
    justifyContent:'space-around',
  },
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    //console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
};

export default Home
