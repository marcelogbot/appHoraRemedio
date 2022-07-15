import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect, useRef }  from 'react'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, 
          ScrollView, Alert, Modal } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../componentes/Header'
import moment from 'moment'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import ModalTempoTratamento from '../componentes/ModalTempoTratamento'
import ModalFrequenciaTratamento from '../componentes/ModalFrequenciaTratamento'
import ModalDataInicio from '../componentes/ModalDataInicio'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const LABEL_TEMPO_TRATAMENTO = 'Qual a duração do tratamento?';
const LABEL_FREQUENCIA_TRATAMENTO = 'Qual a frequência de uso?';
const LABEL_DATA_INICO = 'Qual dia e horário irá começar?';

function Cad_Med(props) {

  //Dados cadastro de notificação
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  //Dados do medicamento e forma de tomar
  const [id,setId] = useState('');
  const [dataInicio,setDataInicio] = useState(new Date);
  const [nomeMed,setNomeMed] = useState('');
  const [observacao, setObservacao] = useState('');
  const [tempoTratamento, setTempoTratamento] = useState({num:'0', medidaTempo:"dia(s)", tratamentoContinuo:false}); // tempo = Dias ou Semanas
  const [frequenciaTratamento, setFrequenciaTratamento] = useState({num:'0', medidaTempo:{id:'h', nome:"hora(s)"}, diaSemana:[], horarios:[]}); // tempo = Horas, Dias, Semanas ou Meses - diaSemana (1 a 7), horarios (24h)
  const [lembretes,setLembretes] = useState([]);//id:'', dataLembrete:'', concluido:false, dataConcluido:'', idNotificacao:''

  //Labels de apresentação nos campos de edição
  const [labelTempoTrat, setLabelTempoTrat] = useState(LABEL_TEMPO_TRATAMENTO); //Ex.: USar por 10 dias ou Usar por 5 semanas
  const [labelFreq, setLabelFreq] = useState(LABEL_FREQUENCIA_TRATAMENTO); // Ex.: a cada 6 horas ou 1 vez por semana (às seg e ter)
  const [labelDataInicio, setLabelDataInicio] = useState(LABEL_DATA_INICO);

  //Controle de Modais
  const [showModalTT,setShowModalTT] = useState(false);
  const [showModalFT,setShowModalFT] = useState(false);
  const [showModalDI,setShowModalDI] = useState(false);
  const [salvando,setSalvando] = useState(false);
  const [freqSemanal, setFreqSemanal] = useState('none');
  const [diaSemanaSelected, setDiaSemanaSelected] = useState('');
  const refTempoTratamento = useRef();
  const refFreqTratamento = useRef();
  const refDataInicio = useRef();

  //Calcula tempo do tratamento e fecha modal
  function tempoTratamentoSelected() {
      
    if (showModalTT) {setShowModalTT(false)};
    
    tempoTratamento.medidaTempo = refTempoTratamento.current.state.tipoSelected.nome;
    tempoTratamento.tratamentoContinuo = refTempoTratamento.current.state.continuo;
    tempoTratamento.num = refTempoTratamento.current.state.qtd;

    if (refTempoTratamento.current.state.continuo) {

      setLabelTempoTrat('Tratamento de uso contínuo.')

    } else if (tempoTratamento.num != 0 && !refTempoTratamento.current.state.continuo) {

      setLabelTempoTrat('Usar por '+tempoTratamento.num+' '+tempoTratamento.medidaTempo)

    } else{

      setLabelTempoTrat(LABEL_TEMPO_TRATAMENTO)
    };
  };

  //Registra a frequência do tratamento
  function frequenciaTratamentoSelected() {
    frequenciaTratamento.num = refFreqTratamento.current.state.num;
    frequenciaTratamento.medidaTempo = refFreqTratamento.current.state.medidaTempo;
    frequenciaTratamento.diaSemana = refFreqTratamento.current.state.diaSemana; 
    frequenciaTratamento.horarios = refFreqTratamento.current.state.horarios;

    refFreqTratamento.current.state.personalizar = false;
    setShowModalFT(false)

    if (frequenciaTratamento.num == 0) {

      setLabelFreq(LABEL_FREQUENCIA_TRATAMENTO);

    } else {
      setLabelFreq('Usar a cada '+frequenciaTratamento.num +' '+frequenciaTratamento.medidaTempo.nome);
      if(frequenciaTratamento.medidaTempo.id == 's') {
        let diaSemanaStr = ''
        for(let i=0; i<frequenciaTratamento.diaSemana.length; i++) {
          if (frequenciaTratamento.diaSemana[i].selected) {
            diaSemanaStr += frequenciaTratamento.diaSemana[i].nome+', '
          }
        }
        setDiaSemanaSelected(diaSemanaStr)
        setFreqSemanal('flex');
      } else {
        setDiaSemanaSelected('')
        setFreqSemanal('none')
      }
    }
  };

  //Registra a data e hora inicial do tratamento
  function dataInicioSelected() {

    const dataInicioStr = refDataInicio.current.state.selectedDate;
    let diaSemana = refDataInicio.current.state.diaSemana.nome
    setDataInicio(new Date(dataInicioStr))  

    moment.locale('pt')
    setLabelDataInicio(diaSemana+' '+moment(new Date(dataInicioStr)).format('DD/MMM/YYYY [às] HH:mm'));
    setShowModalDI(false);

  };

  function limparDataInicio() {
    setLabelDataInicio(LABEL_DATA_INICO);
    setDataInicio(null)
  };

  async function gerarLembretes() {

    setLembretes([]);

    let tempoTotal = 0;

    if(tempoTratamento.tratamentoContinuo) {
      tempoTotal=1;

      console.log('tratamento contínuo!')
    } else if (tempoTratamento.medidaTempo == 'semana(s)') {
      tempoTotal = tempoTratamento.num * 7;
      console.log('tratamento em semanas!')

    } else {
      tempoTotal = tempoTratamento.num;
      console.log('tratamento em dias!'+ tempoTratamento.medidaTempo)

    };

    let freqHoras = 0;
    let qtdAlarmes = 0;

    switch (frequenciaTratamento.medidaTempo.id) {
      case 'h':
        qtdAlarmes = (tempoTotal*24)/frequenciaTratamento.num;
        freqHoras = frequenciaTratamento.num;
        console.log('frequencia em horas!')
        break;
      case 'd':
        qtdAlarmes = tempoTotal/frequenciaTratamento.num;
        freqHoras = frequenciaTratamento.num*24;
        console.log('frequencia em dias!')
        break;
      case 's':
        qtdAlarmes = tempoTotal/(frequenciaTratamento.num*7);
        freqHoras = frequenciaTratamento.num*(24*7);
        console.log('frequencia em semanas!')
        break;
      case 'm':
        freqHoras = 0 //repetir o mesmo dia de início a cada mês 
        qtdAlarmes = tempoTotal/(frequenciaTratamento.num*30);
        console.log('frequencia em meses!')
        break;
    };

    //Primeiro lembrete
    let id = 1;
    const dataLembrete = new Date(dataInicio)
    
    if (frequenciaTratamento.horarios.length == 0) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora do remédio!',
          body: 'Tomar o ' + nomeMed.trim() + '\nàs ' + moment(dataLembrete).format('HH:mm [-] DD/MM/YY'),
        },
        trigger: {date: new Date(dataLembrete)},
      });

      const lembrete1 = {id:id, 
                        dataLembrete:dataLembrete, 
                        concluido:false,
                        dataConcluido:'', 
                        idNotificacao:notificationId};

      id++
      lembretes.push(lembrete1);

    } else {
      
      for (let j =0; j < frequenciaTratamento.horarios.length;j++) {

        dataLembrete.setHours(frequenciaTratamento.horarios[j].hora,frequenciaTratamento.horarios[j].min,0,0);
        if (j==0) {

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Hora do remédio!',
              body: 'Tomar o ' + nomeMed.trim() + '\nàs ' + moment(dataLembrete).format('HH:mm [-] DD/MM/YY'),
            },
            trigger: {date: new Date(dataLembrete)},

          });
            lembretes.push({id:id,
                          dataLembrete:new Date(dataLembrete),
                          concluido:false,
                          dataConcluido:'',
                          idNotificacao:notificationId});
          id++;

        } else {

            lembretes.push({id:id,
                          dataLembrete:new Date(dataLembrete),
                          concluido:false,
                          dataConcluido:'',
                          idNotificacao:''});
            id++;
          }
      };
    };
    console.log('Primeiro lembrete!')

    //Gerando os lembretes seguintes
    if (frequenciaTratamento.horarios.length == 0 && frequenciaTratamento.medidaTempo.id != 'm' && !tempoTratamento.tratamentoContinuo) {
      console.log('Lembrete por repetição!')

      for (let i = 1 ; i <= qtdAlarmes ; i++) {
        let n = parseInt(freqHoras)

        if (frequenciaTratamento.medidaTempo.id == 's') {
          const dataSemana = new Date(dataLembrete)
          //lista dias da semana
          for (let s=0 ; s<7;s++) {
            dataSemana.setHours(dataSemana.getHours()+24,dataSemana.getMinutes(),0,0);
            let selectedDiaSemana = frequenciaTratamento.diaSemana.filter(data => data.id == (dataSemana.getDay()+1))
            if (selectedDiaSemana[0].selected) {
            
              lembretes.push({id:id,
                              dataLembrete:new Date(dataSemana),
                              concluido:false,
                              dataConcluido:'',
                              idNotificacao:''
                            });
              id++;
            };
            
          };
          dataLembrete.setHours(dataLembrete.getHours()+n,dataLembrete.getMinutes(),0,0);
        } else {
          if (i==qtdAlarmes) {

          } else {
            dataLembrete.setHours(dataLembrete.getHours()+n,dataLembrete.getMinutes(),0,0);
            lembretes.push({id:id,
                            dataLembrete:new Date(dataLembrete),
                            concluido:false,
                            dataConcluido:'',
                            idNotificacao:''
                          });
            id++;
          }
        };
        
      };

    } else if (frequenciaTratamento.horarios.length > 0 && frequenciaTratamento.medidaTempo.id != 'm' && frequenciaTratamento.medidaTempo.id != 'h' && !tempoTratamento.tratamentoContinuo) {
      console.log('Lembrete com hora específica!')

      for (let i = 2 ; i <= qtdAlarmes ; i++) {
        let n = parseInt(freqHoras)

        if (frequenciaTratamento.medidaTempo.id == 's') {
          const dataSemana = new Date(dataLembrete)
          //lista dias da semana
          for (let s=0 ; s<7;s++) {
            dataSemana.setHours(dataSemana.getHours()+24,dataSemana.getMinutes(),0,0);
            let selectedDiaSemana = frequenciaTratamento.diaSemana.filter(data => data.id == dataSemana.getDay()+1)
            if (selectedDiaSemana[0].selected) {
              
              for (let j =0; j < frequenciaTratamento.horarios.length;j++) {
                dataSemana.setHours(frequenciaTratamento.horarios[j].hora,frequenciaTratamento.horarios[j].min,0,0);
                lembretes.push({id:id,
                                dataLembrete:new Date(dataSemana),
                                concluido:false,
                                dataConcluido:'',
                                idNotificacao:''});
                id++;
              };
            };
          };

        } else {

          console.log('Lembrete em dias normais!')
          dataLembrete.setHours(dataLembrete.getHours()+n,dataLembrete.getMinutes(),0,0);
          for (let j =0; j < frequenciaTratamento.horarios.length;j++) {
            dataLembrete.setHours(frequenciaTratamento.horarios[j].hora,frequenciaTratamento.horarios[j].min,0,0);
            lembretes.push({id:id,
                            dataLembrete:new Date(dataLembrete),
                            concluido:false,
                            dataConcluido:'',
                            idNotificacao:''});
            id++;
          };
        };
      };
    };
  };

  async function salvarMedicamento() {

    if(nomeMed=='' || labelTempoTrat==LABEL_TEMPO_TRATAMENTO || labelFreq==LABEL_FREQUENCIA_TRATAMENTO || labelDataInicio==LABEL_DATA_INICO) {
      Alert.alert(
        "Faltam informações!",
        "Você precisa informar o nome do medicamento, o tempo do tratamento, a frequência de uso e a data e hora inicial do tratamento!"
      );
    } else {

      setSalvando(true);
      await gerarLembretes();

      const medicamento = {id:id, nome:nomeMed, duracao:tempoTratamento, frequencia:frequenciaTratamento, dataInicio:dataInicio, anotacao:observacao, lembretes:lembretes};

      try {
        const jsonValue = JSON.stringify(medicamento);
        await AsyncStorage.setItem(id, jsonValue)
        console.log('Valor salvo com sucesso! - ' + id.toString())

      } catch (e) {
        // saving error
        Alert.alert(
          "Erro ao Salvar",
          "Erro: " + e
        )
      } 
      console.log('Salvando o medicamento:\n'+JSON.stringify(medicamento));
      setSalvando(false);
      props.navigation.goBack()
    };

  };

  useEffect(() => {
    setId('@'+moment(new Date).format('YYYYMMDDHHmmss'))
    //Configurando notificações
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
    };
  },[]);

  return (

    <View style={styles.conteiner}>
        <Header title = {'Novo Medicamento'} 
          iconEsq={'chevron-left'} 
          onPressEsq={() => props.navigation.goBack()}
        />
        
        <ScrollView keyboardDismissMode = 'on-drag'>
        
          <View  style = {{alignItems:'center',marginTop:5}}>
            <TextInput style = {styles.inputNomeMed}
              placeholder = 'Nome do Medicamento'
              value={nomeMed}
              onChangeText={(text) => setNomeMed(text)}
              maxLength={30} />

            <View style = {styles.separador} />

            <TouchableOpacity style = {styles.inputTempoTratamento} onPress={() => setShowModalTT(true)} >
              <MaterialCommunityIcons name='calendar-blank' size={26} color='#444444'/>
              <Text style = {[styles.labelTempTratamento,{fontWeight: tempoTratamento.num == '0' && !tempoTratamento.tratamentoContinuo?'normal':'bold'}]} >
                {labelTempoTrat}
              </Text>
            </TouchableOpacity>

            <ModalTempoTratamento
              visible={showModalTT}
              onRequestClose = {() => setShowModalTT(false)}
              qtd={tempoTratamento.num}
              continuo={tempoTratamento.tratamentoContinuo}
              ref={refTempoTratamento}
            >
              <Text style = {styles.btnOK} onPress={() => tempoTratamentoSelected()}> Ok </Text> 
            </ModalTempoTratamento>

            <View style = {styles.separador} />

            <TouchableOpacity style = {styles.inputTempoTratamento} onPress={() => setShowModalFT(true)} >
              <MaterialCommunityIcons name='clock-outline' size={26} color='#444444'/>
              <View style={{flexDirection:'column'}}>
                <Text style = {[styles.labelTempTratamento,{fontWeight: frequenciaTratamento.num == '0'?'normal':'bold'}]} >
                  {labelFreq}
                </Text>
                <Text style = {[styles.labelDiasSemana,{display:freqSemanal}]} >
                  {diaSemanaSelected}
                </Text>
              </View>
            </TouchableOpacity>

            <ModalFrequenciaTratamento
              visible={showModalFT}
              onRequestClose = {() => setShowModalFT(false)}
              ref={refFreqTratamento}
            >
              <Text style = {{fontSize:20, fontWeight:'bold', marginTop:10, padding:10}} onPress={() => frequenciaTratamentoSelected()}> Ok </Text>

            </ModalFrequenciaTratamento>

            <View style = {styles.separador} />

            <TouchableOpacity style = {styles.inputTempoTratamento} onPress={() => setShowModalDI(true)}>
                <MaterialCommunityIcons name='calendar-start' size={26} color='#444444'/>
                <Text style = {[styles.labelTempTratamento,{fontWeight: labelDataInicio == LABEL_DATA_INICO?'normal':'bold'}]} >
                  {labelDataInicio}
                </Text>
                <MaterialCommunityIcons name='calendar-remove' size={26} color='#EC6F55' 
                    style={{position:'absolute', alignSelf:'center', right:30, display:labelDataInicio != LABEL_DATA_INICO?'flex':'none'}}
                    onPress={() => limparDataInicio()}/>
            </TouchableOpacity>

            <ModalDataInicio
              visible={showModalDI}
              onRequestClose = {() => setShowModalDI(false)}
              ref={refDataInicio}
            >
              <Text style = {{fontSize:20, fontWeight:'bold', marginTop:10, padding:10}} onPress={() => dataInicioSelected()}> Ok </Text>
            </ModalDataInicio>

            <View style = {styles.separador} />

            <View style = {styles.observacaoView}>
              <Text style = {styles.observacaoLabel}>Anotações:</Text>
              <TextInput style = {styles.observacaoInput}
              placeholder={'Informe dados sobre o medicamento como forma de usar, dosagem ou outra anotação sobre o tratamento.'}
              multiline = {true}
              placeholderTextColor={'#666666'}
              value={observacao}
              maxLength={160}
              onChangeText = {(text) => setObservacao(text)}
              scrollEnabled={true}
              
              />
            </View>

          </View>
        </ScrollView>
        <Modal
          visible={salvando}
          animationType={'fade'}
          transparent={true}
          >
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(256,256,256,0.5)'}}>
              <View style={{alignItems:'center', justifyContent:'center',
                          width:'50%', height:'20%', backgroundColor:'#eeeeee',
                          alignSelf:'center', borderRadius:20, elevation:10, top:'30%', padding:10}}>
                <Text style={{fontSize:20, fontWeight:'bold', textAlign:'center'}}>Salvando os dados do tratamento, aguarde...</Text>
                <View style={{alignItems:'center', justifyContent:'center'}}>
                  <LottieView style={{height:70, width:70}} source={require('../assets-comp/lottie/waiting.json')} autoPlay loop />
                </View>
              </View>
            </View>
        </Modal>

        <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => salvarMedicamento()}
              style={[{flexDirection:'row',backgroundColor:'#123',
                                justifyContent:'center', alignItems:'center', padding:5, elevation:0,
                                position:'absolute',bottom:0, width:'100%', zIndex:1, flexDirection:'row', alignItems:'center'}]}>
                <MaterialCommunityIcons name={'file-document-outline'} color={'#dddddd'} size={24}/>
                <Text numberOfLines={1} style = {{fontSize:22, color:'#dddddd'}} >{' '}Salvar medicamento</Text>
          </TouchableOpacity>

      </View>
  )
};

const styles = StyleSheet.create({
  conteiner: {
    flex: 1,
    backgroundColor:'#cccccc',
  },
  separador: {
    backgroundColor:'#aaaaaa', 
    height:1.5, 
    width:'95%'
  },
  inputNomeMed: {
    color: '#444444',
    borderColor:'#555555',
    padding:15,
    paddingLeft:25,
    fontSize:24,
    fontWeight:'bold',
    borderRadius:3,
    backgroundColor:'#ffffff',
    width: '100%',
    elevation:4,
  },
  inputTempoTratamento: {
    flexDirection:'row',
    alignItems:'center',
    borderRadius:3,
    width: '100%',
    backgroundColor:'#ffffff', 
    padding:15,
    paddingLeft:15,
  },
  labelTempTratamento: {
    color: '#444444',
    fontSize:20, 
    marginLeft:5,
  },
  labelDiasSemana: {
    color: '#666666',
    fontSize:18, 
    marginLeft:5,
  },
  observacaoView: {
    backgroundColor:'#ffffff',
    alignItems:'flex-start',
    width: '100%',      
    padding:10,
    paddingLeft:15,
    borderRadius:3,
  },
  observacaoLabel: {
    fontWeight:'bold',
    fontSize:16,
    color: '#444444',
  },
  observacaoInput: { 
    padding:10,
    paddingHorizontal:5,
    fontSize:15,
    height: 220,
    textAlignVertical:'top',
  },
  btnOK: {
    fontSize:20,
    fontWeight:'bold', 
    marginTop:1, 
    padding:10, 
    textAlign:'center',
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

export default Cad_Med
