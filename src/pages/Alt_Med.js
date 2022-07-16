import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect, useRef }  from 'react'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, 
        ScrollView, Alert, Modal } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import moment from 'moment'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import Header from '../componentes/Header'
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

function Alt_Med(props) {

  //Dados cadastro de notificação
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const medicamento = props.route.params.medicamento

  const [lembretes,setLembretes] = useState([]);

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

  function tempoTratamentoSelected() {
      
    if (showModalTT) {setShowModalTT(false)};
    
    medicamento.duracao.medidaTempo = refTempoTratamento.current.state.tipoSelected.nome;
    medicamento.duracao.tratamentoContinuo = refTempoTratamento.current.state.continuo;
    medicamento.duracao.num = refTempoTratamento.current.state.qtd;

    if (refTempoTratamento.current.state.continuo) {
      setLabelTempoTrat('Tratamento de uso contínuo.')
    } else if (medicamento.duracao.num != 0 && !refTempoTratamento.current.state.continuo) {
      setLabelTempoTrat('Usar por '+medicamento.duracao.num+' '+medicamento.duracao.medidaTempo)
    } else{
      setLabelTempoTrat(LABEL_TEMPO_TRATAMENTO)
    };
  };

  //Registra a frequência do tratamento
  function frequenciaTratamentoSelected() {
    medicamento.frequencia.num = refFreqTratamento.current.state.num;
    medicamento.frequencia.medidaTempo = refFreqTratamento.current.state.medidaTempo;
    medicamento.frequencia.diaSemana = refFreqTratamento.current.state.diaSemana; 
    medicamento.frequencia.horarios = refFreqTratamento.current.state.horarios;

    //fecha modais
    refFreqTratamento.current.state.personalizar = false;
    setShowModalFT(false)

    if (medicamento.frequencia.num == 0) {
      setLabelFreq(LABEL_FREQUENCIA_TRATAMENTO);
    } else {
      setLabelFreq('Usar a cada '+medicamento.frequencia.num +' '+medicamento.frequencia.medidaTempo.nome);
      if(medicamento.frequencia.medidaTempo.id == 's') {
        let diaSemanaStr = ''
        for(let i=0; i<medicamento.frequencia.diaSemana.length; i++) {
          if (medicamento.frequencia.diaSemana[i].selected) {
            diaSemanaStr += medicamento.frequencia.diaSemana[i].nome+', '
          };
        };
        setDiaSemanaSelected(diaSemanaStr)
        setFreqSemanal('flex');
      } else {
        setDiaSemanaSelected('')
        setFreqSemanal('none')
      };
    };
  };

   //Registra a data e hora inicial do tratamento
   function dataInicioSelected() {

    const dataInicioStr = refDataInicio.current.state.selectedDate;
    let diaSemana = refDataInicio.current.state.diaSemana.nome
    medicamento.dataInicio = new Date(dataInicioStr)

    setLabelDataInicio(diaSemana+' '+moment(new Date(dataInicioStr)).format('DD/MMM/YYYY [às] HH:mm'));
    setShowModalDI(false);

  };

  function limparDataInicio() {
    setLabelDataInicio(LABEL_DATA_INICO);
    medicamento.dataInicio = null;
  };

  async function gerarLembretes() {
    let tempoTotal = 0;

    if(medicamento.duracao.tratamentoContinuo) {
      tempoTotal=1;
    } else if (medicamento.duracao.medidaTempo == 'semana(s)') {
      tempoTotal = medicamento.duracao.num * 7;
    } else {
      tempoTotal = medicamento.duracao.num;
    };
    
    let freqHoras = 0;
    let qtdAlarmes = 0;

    switch (medicamento.frequencia.medidaTempo.id) {
      case 'h':
        qtdAlarmes = (tempoTotal*24)/medicamento.frequencia.num;
        freqHoras = medicamento.frequencia.num;
        break;
      case 'd':
        qtdAlarmes = tempoTotal/medicamento.frequencia.num;
        freqHoras = medicamento.frequencia.num*24;
        break;
      case 's':
        qtdAlarmes = tempoTotal/(medicamento.frequencia.num*7);
        freqHoras = medicamento.frequencia.num*(24*7);
        break;
      case 'm':
        freqHoras = 0 //repetir o mesmo dia de início a cada mês 
        qtdAlarmes = tempoTotal/(medicamento.frequencia.num*30);
        break;
    };

    //Primeiro lembrete
    let id = 1;
    const dataLembrete = new Date(medicamento.dataInicio)
    
    if (medicamento.frequencia.horarios.length == 0) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora do remédio!',
          body: 'Tomar o ' + medicamento.nome.trim() + '\nàs ' + moment(dataLembrete).format('HH:mm [-] DD/MM/YY'),
        },
        trigger: {date: new Date(dataLembrete)},
      });

      const lembrete1 = {id:id, 
                        dataLembrete:new Date(dataLembrete), 
                        concluido:false,
                        dataConcluido:'', 
                        idNotificacao:notificationId};

      id++
      lembretes.push(lembrete1);

    } else {
      
      for (let j =0; j < medicamento.frequencia.horarios.length;j++) {

        dataLembrete.setHours(medicamento.frequencia.horarios[j].hora,medicamento.frequencia.horarios[j].min,0,0);
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
    if (medicamento.frequencia.horarios.length == 0 && medicamento.frequencia.medidaTempo.id != 'm' && !medicamento.duracao.tratamentoContinuo) {

      for (let i = 1 ; i <= qtdAlarmes ; i++) {
        let n = parseInt(freqHoras)

        if (medicamento.frequencia.medidaTempo.id == 's') {
          const dataSemana = new Date(dataLembrete)
          
          //lista dias da semana
          for (let s=0 ; s<7;s++) {
            dataSemana.setHours(dataSemana.getHours()+24,dataSemana.getMinutes(),0,0);
            let selectedDiaSemana = medicamento.frequencia.diaSemana.filter(data => data.id == (dataSemana.getDay()+1))
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

    } else if (medicamento.frequencia.horarios.length > 0 && medicamento.frequencia.medidaTempo.id != 'm' && medicamento.frequencia.medidaTempo.id != 'h' && !medicamento.frequencia.tratamentoContinuo) {
      console.log('Lembrete com hora específica!')

      for (let i = 2 ; i <= qtdAlarmes ; i++) {
        let n = parseInt(freqHoras)

        if (medicamento.frequencia.medidaTempo.id == 's') {
          const dataSemana = new Date(dataLembrete)
          //lista dias da semana
          for (let s=0 ; s<7;s++) {
            dataSemana.setHours(dataSemana.getHours()+24,dataSemana.getMinutes(),0,0);
            let selectedDiaSemana = medicamento.frequencia.diaSemana.filter(data => data.id == dataSemana.getDay()+1)
            if (selectedDiaSemana[0].selected) {
              
              for (let j =0; j < medicamento.frequencia.horarios.length;j++) {
                dataSemana.setHours(medicamento.frequencia.horarios[j].hora,medicamento.frequencia.horarios[j].min,0,0);
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
          for (let j =0; j < medicamento.frequencia.horarios.length;j++) {
            dataLembrete.setHours(medicamento.frequencia.horarios[j].hora,medicamento.frequencia.horarios[j].min,0,0);
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

  function alterarMedicamento() {

    if(medicamento.nome=='' || labelTempoTrat==LABEL_TEMPO_TRATAMENTO || labelFreq==LABEL_FREQUENCIA_TRATAMENTO || labelDataInicio==LABEL_DATA_INICO) {
      Alert.alert(
        "Faltam informações!",
        "Você precisa informar o nome do medicamento, o tempo do tratamento, a frequência de uso e a data e hora inicial do tratamento!"
      );

    } else {

      Alert.alert(
        "Atenção!",
        "Essa alteração irá gerar novos lembretes e remover os lembretes anteriores, deseja continuar mesmo assim?",
        [{
          text: 'Cancelar',
          style:'cancel',
          },
          {
          text:'Sim, quero alterar!',
          onPress: () => salvarAlteracao()},]
      );
    };
  };

  async function salvarAlteracao() {

      setSalvando(true);
      
      await gerarLembretes();

      try {
        medicamento.lembretes = lembretes
        const jsonValue = JSON.stringify(medicamento);
        await AsyncStorage.setItem(medicamento.id, jsonValue)
        console.log('Valor salvo com sucesso! - ' + medicamento.id.toString())

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

  const confirmExcluirRegistro = () => {
    Alert.alert(
      "Excluir Medicamento!",
      "Tem certeza que deseja exluir esse medicamento? ",
      [{
        text: 'Cancelar',
        style:'cancel',
      },
      {
        text:'Tenho certeza!',
        onPress: () => excluirRegistro()},]
    );
  };

  const cancelarNotificacoesAnteriores = async () => {
    console.log('Cancelando Notificações')
    for (let not of medicamento.lembretes) {
      console.log('Lembrete: '+JSON.stringify(not))
      if(not.idNotificacao != '') {
        await Notifications.cancelScheduledNotificationAsync(not.idNotificacao);
      };
    };
  };

  const excluirRegistro = async () => {
    try {
      await cancelarNotificacoesAnteriores()
      await AsyncStorage.removeItem(medicamento.id)
      props.navigation.navigate('Início')
    } catch (e) {
      Alert.alert(
        "Erro ao Exluir",
        "Erro: " + e
      )
    }
  }

  useEffect(() => {

    //Define label inicial - Tempo de Tratamento
    if (refTempoTratamento.current.state.continuo) {
      setLabelTempoTrat('Tratamento de uso contínuo.')
    } else if (medicamento.duracao.num != 0 && !refTempoTratamento.current.state.continuo) {
      setLabelTempoTrat('Usar por '+medicamento.duracao.num+' '+medicamento.duracao.medidaTempo)
    } else{
      setLabelTempoTrat(LABEL_TEMPO_TRATAMENTO)
    };

    //Define label inicial - Frequencia do tratamento
    if (medicamento.frequencia.num == 0) {
      setLabelFreq(LABEL_FREQUENCIA_TRATAMENTO);
    } else {
      setLabelFreq('Usar a cada '+medicamento.frequencia.num +' '+medicamento.frequencia.medidaTempo.nome);
      if(medicamento.frequencia.medidaTempo.id == 's') {
        let diaSemanaStr = ''
        for(let i=0; i<medicamento.frequencia.diaSemana.length; i++) {
          if (medicamento.frequencia.diaSemana[i].selected) {
            diaSemanaStr += medicamento.frequencia.diaSemana[i].nome+', '
          };
        };
        setDiaSemanaSelected(diaSemanaStr)
        setFreqSemanal('flex');
      } else {
        setDiaSemanaSelected('')
        setFreqSemanal('none')
      };
    };

    //Define label inicial - Data início
    var diaSemana = '';
    switch (new Date(medicamento.dataInicio).getDay()) {
      case 0:
        diaSemana = 'Dom.'
        break;
      case 1:
        diaSemana = 'Seg.'
        break;
      case 2:
        diaSemana = 'Ter.'
        break;
      case 3:
        diaSemana = 'Qua.'
        break;
      case 4:
        diaSemana = 'Qui.'
        break;
      case 5:
        diaSemana = 'Sex.'
        break;
      case 6:
        diaSemana = 'Sab.'
        break;
    };
    setLabelDataInicio(diaSemana+' '+moment(new Date(medicamento.dataInicio)).format('DD/MMM/YYYY [às] HH:mm'));

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
    <View style = {styles.conteiner}>
      <Header title = {'Alterar Medicamento'} iconEsq={'chevron-left'} colorEsq={'#cccccc'} onPressEsq={() => props.navigation.navigate('Detalhes',{key:medicamento.id})}
                iconDir={'trash-can-outline'} colorDir={'#cccccc'} onPressDir={() => confirmExcluirRegistro()}/>
      
      <ScrollView keyboardDismissMode = 'on-drag'>
        <View  style = {{alignItems:'center',marginTop:5}}>
          <TextInput style = {styles.inputNomeMed}
            placeholder = 'Nome do Medicamento'
            value={medicamento.nome}
            onChangeText={(text) => setNomeMed(text)}
            maxLength={30} />

          <View style = {styles.separador} />

          <TouchableOpacity style = {styles.inputTempoTratamento} onPress={() => setShowModalTT(true)} >
            <MaterialCommunityIcons name='calendar-blank' size={26} color='#444444'/>
            <Text style = {[styles.labelTempTratamento,{fontWeight: medicamento.duracao.num == '0' && !medicamento.duracao.tratamentoContinuo?'normal':'bold'}]} >
              {labelTempoTrat}
            </Text>
          </TouchableOpacity>

          <ModalTempoTratamento
            visible={showModalTT}
            onRequestClose = {() => setShowModalTT(false)}
            qtd={medicamento.duracao.num}
            continuo={medicamento.duracao.tratamentoContinuo}
            ref={refTempoTratamento}
          >
            <Text style = {styles.btnOK} onPress={() => tempoTratamentoSelected()}> Ok </Text> 
          </ModalTempoTratamento>

          <View style = {styles.separador} />

          <TouchableOpacity style = {styles.inputTempoTratamento} onPress={() => setShowModalFT(true)} >
              <MaterialCommunityIcons name='clock-outline' size={26} color='#444444'/>
              <View style={{flexDirection:'column'}}>
                <Text style = {[styles.labelTempTratamento,{fontWeight: medicamento.frequencia.num == '0'?'normal':'bold'}]} >
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
                value={medicamento.anotacao}
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
              <Text style={{fontSize:20, fontWeight:'bold', textAlign:'center'}}>Alterando os dados do medicamento, aguarde...</Text>
              <View style={{alignItems:'center', justifyContent:'center'}}>
                <LottieView style={{height:70, width:70}} source={require('../assets-comp/lottie/waiting.json')} autoPlay loop />
              </View>
            </View>
          </View>
      </Modal>

        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => alterarMedicamento()}
            style={[{flexDirection:'row',backgroundColor:'#875502',
                              justifyContent:'center', alignItems:'center', padding:10, elevation:0,
                              position:'absolute',bottom:0, width:'100%', zIndex:1, flexDirection:'row', alignItems:'center'}]}>
              <MaterialCommunityIcons name={'file-document-edit-outline'} color={'#dddddd'} size={24}/>
              <Text numberOfLines={1} style = {{fontSize:22, color:'#dddddd'}} >{' '}Salvar alteração</Text>
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

export default Alt_Med
