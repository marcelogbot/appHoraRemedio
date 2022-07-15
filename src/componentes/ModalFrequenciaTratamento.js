import React from 'react'
import {View, Modal, StyleSheet, Text, Animated, TouchableOpacity, FlatList, TextInput} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

class ModalFrequenciaTratamento extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {  
            num:'0', 
            medidaTempo:{id:'h',nome:'hora(s)'}, 
            diaSemana:[{id:'1',nome:'dom',selected:false},{id:'2',nome:'seg',selected:true},
                        {id:'3',nome:'ter',selected:true},{id:'4',nome:'qua',selected:true},
                        {id:'5',nome:'qui',selected:true},{id:'6',nome:'sex',selected:true}, 
                        {id:'7',nome:'sab',selected:false}],
            horarios:[],

            showBtnMenuHoras: 'none',
            showPicker:false,
            defaultDatePicker:new Date(),
            personalizar:false,
            showMenuHorario:'none',
            menuTipoTempo:[],
            showDiaSemana:'none',
            selectedHora:{hora:'06',min:'00'},
         }

         this.modalRef = React.createRef();
         this.handleChange = this.handleChange.bind(this);
         this.selectDiaSemana = this.selectDiaSemana.bind(this);
         this.addHorario = this.addHorario.bind(this);
    };

    componentDidMount() {
        this.setState({personalizar:false});    
    };

    handleChange(num) {
        this.setState({ num: num });
    };

    selectTipoTempo(item) {
        this.setState({ medidaTempo: item,
                        menuTipoTempo:[] });
        if (item.id == 's') {
            this.setState({showDiaSemana:'flex'})
        } else {
            this.setState({showDiaSemana:'none'})
        };

        if (item.id == 'h') {
            this.setState({showMenuHorario: 'none',
                            horarios:[],
                            selectedHora:{hora:'00', min:'00'},
                            showBtnMenuHoras:'none'})
        } else {
            this.setState({showBtnMenuHoras:'flex'})
        };

        if (this.state.horarios.length > 0 && item.id !='h') {
            this.setState({showMenuHorario: 'flex'})
        };
    };

    listMenuTipoTempo() {
        if (this.state.menuTipoTempo.length == 0) {
            this.setState({menuTipoTempo:[{id:'h', nome:'hora(s)'},
                                        {id:'d', nome:'dia(s)'},
                                        {id:'s', nome:'semana(s)'}],});
                                        //{id:'m', nome:'mes(es)'}],});
        } else {
            this.setState({menuTipoTempo:[]});  
        }
    };

    showMenuHorarioView() {

        if (this.state.showMenuHorario == 'flex') {
            this.setState({showMenuHorario: 'none',
                            horarios:[]})
        } else {
            this.setState({showMenuHorario: 'flex'})
        } 
    };

    selectHora = (event, timeChoose) => {

        let hora = moment(timeChoose).format('HH');
        let min = moment(timeChoose).format('mm');

        this.setState({selectedHora:{hora:hora,min:min},
                        defaultDatePicker:timeChoose,
                        showPicker:false});

        this.addHorario(this.state.selectedHora);
    };

    listMenuHora () {
       this.setState({showPicker:true});
    };

    selectDiaSemana(dia)  {
        
        this.state.diaSemana[dia-1].selected = !this.state.diaSemana[dia-1].selected
        const countSelected = this.state.diaSemana.filter(data => data.selected == true);
        if (countSelected.length < 1) {
            this.state.diaSemana[dia-1].selected = !this.state.diaSemana[dia-1].selected
        };

        this.forceUpdate()
    };

    abreModalPersonalizar() {
        
        if(this.state.medidaTempo.id != 's') {
            this.setState({showDiaSemana:'none'})
        ;}

        if(this.state.medidaTempo.id != 'h') {
            
            if (this.state.horarios.length == 0) {
                
                this.setState({showMenuHorario:'none',
                                showBtnMenuHoras:'flex'})
            } else {
                this.setState({showMenuHorario:'flex',
                                showBtnMenuHoras:'flex'})
            }
            
        } else {
            this.setState({showMenuHorario:'none',
                            showBtnMenuHoras:'none'})
        };
        this.setState({personalizar:true})
    };

    personalizado() {
        if ((this.state.num == 0) || (this.state.num == 6 && this.state.medidaTempo.id == 'h' )
            || (this.state.num == 8 && this.state.medidaTempo.id == 'h' ) || (this.state.num == 12 && this.state.medidaTempo.id == 'h' )
            || (this.state.num == 1 && this.state.medidaTempo.id == 'd') || (this.state.horarios.length > 0 && this.state.medidaTempo.id == 'h')) {

            return 'normal';

        } else {

            return 'bold';
        }
    }

    fechaModais() {
        this.setState({personalizar:false})
        this.modalRef.current.visible = false
    };

    addHorario(item) {
        let n = 0;

        for (let i=0;i<this.state.horarios.length;i++) {
            if (item.hora == this.state.horarios[i].hora && item.min == this.state.horarios[i].min) {
                n++
            }
        }
        
        if (n==0) {
            const horario = item;
            const newHorarios = this.state.horarios.slice();
            newHorarios.push({hora:horario.hora,min:horario.min})
            newHorarios.sort((a,b)=>{
                if(a.hora===b.hora) {
                    return a.min - b.min
                } else {
                    return a.hora.localeCompare(b.hora)
                }
                })
            this.setState({horarios:newHorarios})
        }   
    };

    removeHorario(item) {
       let index =  this.state.horarios.findIndex(e => e == item);
       this.state.horarios.splice(index,1);
       this.forceUpdate();
    };

render () {
    
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={this.props.visible}
            onRequestClose ={this.props.onRequestClose}
            ref={this.modalRef}
        >
             <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(256,256,256,0.5)'}}>
                <View style = {styles.modalFreq}>
                   
                    <Text style = {{fontSize:20, fontWeight:`${this.state.num}` == 6 && `${this.state.medidaTempo.id}` == 'h'?'bold':'normal', marginTop:15, padding:5}} 
                    onPress={() => this.setState({num:'6',medidaTempo:{id:'h',nome:'hora(s)'}, horarios:[]})} 
                    >De 6 em 6 horas</Text>

                    <Text  >--------------------------------------------------------</Text>
                    
                    <Text style = {{fontSize:20, padding:5 ,fontWeight:`${this.state.num}` == 8 && `${this.state.medidaTempo.id}` == 'h'? 'bold':'normal'}}
                        onPress={() => this.setState({num:'8',medidaTempo:{id:'h',nome:'hora(s)'}, horarios:[]})} 
                        >De 8 em 8 horas</Text>

                    <Text  >--------------------------------------------------------</Text>
                    
                    <Text style = {{fontSize:20, padding:5 , fontWeight:`${this.state.num}` == 12 && `${this.state.medidaTempo.id}` == 'h'? 'bold':'normal'}} 
                        onPress={() => this.setState({num:'12',medidaTempo:{id:'h',nome:'hora(s)'}, horarios:[]})} 
                        >De 12 em 12 horas</Text>

                    <Text  >--------------------------------------------------------</Text>
                    
                    <Text style = {{fontSize:20, padding:5 , fontWeight:`${this.state.num}` == 1 && `${this.state.medidaTempo.id}` == 'd' && `${this.state.horarios.length}` == 0? 'bold':'normal'}} 
                        onPress={() => this.setState({num:'1',medidaTempo:{id:'d',nome:'dia(s)'}, horarios:[]})} 
                        >Uma vez ao dia</Text>

                    <Text  >--------------------------------------------------------</Text>
                    
                    <Text style = {{fontSize:20, padding:5 , marginBottom:15,
                                    fontWeight:this.personalizado()}}
                        onPress={() => this.abreModalPersonalizar()}  > Personalizar </Text>

                    <View style = {styles.separador} />

                    <Modal
                        visible={this.state.personalizar}
                        transparent={true}
                        onRequestClose = {() => this.setState({personalizar:false})}>
                            
                            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(256,256,256,0.5)'}}>
                                <Animated.View style = {styles.modalFreq}>

                                    <View style={{flexDirection:'row', alignItems:'center', marginTop:10}}>
                                        <Text>A cada: </Text>
                                        <TextInput style = {styles.inputFreqTratamento}
                                            keyboardType="number-pad"
                                            onTouchStart={() => this.setState({ num: '' })} 
                                            onEndEditing={this.state.num == '' ? () => this.setState({ num: '0' }) : console.log('')}
                                            value={this.state.num}
                                            editable={true}
                                            onChangeText={(text) =>this.handleChange(text)}
                                            maxLength={2}
                                        />
                                        <View style = {[styles.selectTempo]}>
                                    
                                            <TouchableOpacity onPress={() => this.listMenuTipoTempo()}>
                                                <Text style={{fontSize:17, textAlign:'left', fontWeight:'bold', color:'#222222'}}>
                                                    {this.state.medidaTempo.nome}
                                                </Text>
                                                <MaterialIcons name={'arrow-drop-down'} size={26} color="#333333" style={styles.arrowSelect} />
                                            </TouchableOpacity>

                                            <FlatList
                                                style={{position:'absolute', top:45 , zIndex:5, alignSelf:'flex-start',width:'100%', elevation:4}}
                                                data={this.state.menuTipoTempo}
                                                renderItem={({item}) => {
                                                    return (
                                                        <View style={{backgroundColor:'#ffffff'}} >
                                                            <TouchableOpacity style={{padding:10}} 
                                                                onPress={() => this.selectTipoTempo(item)}>
                                                                <Text style={{fontSize:16}}>{item.nome}</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    );
                                                }}/>
                                        </View>
                                    </View>

                                    <View style={{flexDirection:'row', margin:5, display:this.state.showDiaSemana}}>
                                                
                                        <TouchableOpacity style={this.state.diaSemana[0].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck} onPress={() => this.selectDiaSemana('1')} >
                                            <Text style={{color:this.state.diaSemana[0].selected?'#fff':'#333', fontWeight:this.state.diaSemana[0].selected?'bold':'normal'}}>
                                                {'dom'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={this.state.diaSemana[1].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('2')} >
                                            <Text style={{color:this.state.diaSemana[1].selected?'#fff':'#333', fontWeight:this.state.diaSemana[1].selected?'bold':'normal'}} >
                                                {'seg'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={this.state.diaSemana[2].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('3')} >
                                            <Text style={{color:this.state.diaSemana[2].selected?'#fff':'#333', fontWeight:this.state.diaSemana[2].selected?'bold':'normal'}} >
                                                {'ter'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={this.state.diaSemana[3].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('4')} >
                                            <Text style={{color:this.state.diaSemana[3].selected?'#fff':'#333', fontWeight:this.state.diaSemana[3].selected?'bold':'normal'}} >
                                                {'qua'}
                                            </Text>
                                        </TouchableOpacity>

                                    </View>

                                    <View style={{flexDirection:'row', margin:5, display:this.state.showDiaSemana}}>
                                        <TouchableOpacity style={this.state.diaSemana[4].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('5')} >
                                            <Text style={{color:this.state.diaSemana[4].selected?'#fff':'#333', fontWeight:this.state.diaSemana[4].selected?'bold':'normal'}} >
                                                {'qui'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={this.state.diaSemana[5].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('6')} >
                                            <Text style={{color:this.state.diaSemana[5].selected?'#fff':'#333', fontWeight:this.state.diaSemana[5].selected?'bold':'normal'}}>
                                                {'sex'}
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity style={this.state.diaSemana[6].selected?styles.diaSemanaCheckSelected:styles.diaSemanaCheck}  onPress={() => this.selectDiaSemana('7')} >
                                            <Text style={{color:this.state.diaSemana[6].selected?'#fff':'#333', fontWeight:this.state.diaSemana[6].selected?'bold':'normal'}}>
                                                {'sab'}
                                            </Text>
                                        </TouchableOpacity>

                                    </View>
                                    <TouchableOpacity style={[styles.showMenuHorariosStyle,{display:this.state.showBtnMenuHoras, backgroundColor:this.state.showMenuHorario=='none'?'#123456':'#E91808'}]} onPress={() => this.showMenuHorarioView()}>
                                                    <Text style={{fontSize:16, color:'#dddddd'}}>{this.state.showMenuHorario=='none'?'Definir horarios':'Limpar Horários'}</Text>
                                    </TouchableOpacity>
                                    <View style={{flex:1, display:this.state.showMenuHorario, width:'100%', justifyContent:'center', alignItems:'center'}}>
                                        
                                        <View style = {styles.separador} />

                                        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                                            <View>
                                                <TouchableOpacity style={styles.selectHoraMinuto} onPress={() => this.listMenuHora()}>
                                                    <Text style={{fontSize:28}}>{this.state.selectedHora.hora+':'+this.state.selectedHora.min}</Text>
                                                    <Text style={{fontSize:28}}>{'  '}</Text>
                                                    <MaterialIcons name={'add'} size={28} color="#14487c"/>
                                                </TouchableOpacity>
                                            </View> 
                                            {this.state.showPicker && (
          
                                                <DateTimePicker
                                                    testID="dateTimePicker"
                                                    value={this.state.defaultDatePicker}
                                                    mode={'time'}
                                                    is24Hour={true}
                                                    onChange={this.selectHora}           
                                                />          
                                                )}

                                        </View>

                                        <FlatList
                                            style={{flex:1, backgroundColor:'#ffffff', alignSelf:'center',width:'50%', height:100, borderWidth:0.7, borderColor:'#ece0ae', marginBottom:5, display:this.state.horarios.length == 0?'none':'flex'}}
                                            data={this.state.horarios}
                                            renderItem={({item}) => {
                                                    return (
                                                        <View style={{flex:1, margin:0, padding:10, alignItems:'center', justifyContent:'space-around', flexDirection:'row'}} >
                                                            <View style={{flexDirection:'row'}}>
                                                                <Text style={{fontSize:20}}>{item.hora}</Text>
                                                                <Text style={{fontSize:16}}> : </Text>
                                                                <Text style={{fontSize:20}}>{item.min}</Text>
                                                                <Text style={{fontSize:16}}> {'    '} </Text>
                                                            </View>
                                                            <MaterialIcons name={'remove'} size={26} color="#E91808" onPress={() => this.removeHorario(item)}/>
                                                        </View>
                                                    );
                                            }}/>
                                        </View>
                                    <View style = {styles.separador} /> 
                                    <View style = {{width:'70%', flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                                        <Text style = {{fontSize:20, fontWeight:'bold', marginTop:10, padding:10}} onPress={() => this.setState({personalizar:false})}> Voltar </Text>
                                       {/*<Text style = {{fontSize:20, fontWeight:'bold', marginTop:10, padding:10}} onPress={() => this.fechaModais()}> Ok </Text>*/}
                                       {this.props.children}
                                    </View>

                                </Animated.View>  
                                
                            </View>
                    </Modal>

                    {this.props.children}

                </View>

               
             </View>
        </Modal>
      )
}
 
}

const styles = StyleSheet.create({
    modalFreq: {
        flex: 1,
        borderRadius:5,
        position: 'absolute',
        width: '80%',
        elevation:10,
        backgroundColor:'#fffff6',
        alignContent:'center',
        alignItems:'center',
        padding: 5,
        left: 40,
        top:120,
    },
     separador: {
        backgroundColor:'#aaaaaa', 
        height:1.5, 
        width:'95%'
    },
    selectTempo: {
        width:'40%', 
        backgroundColor:'#FEFEee', 
        padding:5,
        marginVertical: 15,
        height:35,
        justifyContent:'center',
        zIndex:5,
    },
    arrowSelect:{
        position:'absolute',
        alignSelf:'flex-end',
    },
    inputFreqTratamento: {
        backgroundColor:'#FEFEee', 
        textAlign:'center', 
        padding:4, 
        fontSize:20,
        width:'20%', 
        borderRadius:5, 
        borderBottomWidth:1,
    },
    diaSemanaCheck: {
        backgroundColor:'#fff',
        padding:10,
        marginHorizontal: 5,
        alignItems:'center',
        justifyContent:'center',
        borderRadius:30,
        height: 60,
        width: 60,
        borderWidth:1,
        borderColor:'#ece0ae'
    },
    diaSemanaCheckSelected: {
        backgroundColor:'#ece0ae',
        padding:10,
        marginHorizontal: 5,
        alignItems:'center',
        justifyContent:'center',
        borderRadius:30,
        height: 60,
        width: 60,
        borderWidth:1,
        borderColor:'#fff'
    },
    selectHoraMinuto: {
        flexDirection:'row',
        alignItems:'center',
        backgroundColor:'#FEFEee',
        padding: 10,
        borderRadius:4,
    },
    showMenuHorariosStyle: {
        padding: 5,
        margin: 5,
        borderRadius:4,
        elevation:4,
    },
})

export default ModalFrequenciaTratamento
