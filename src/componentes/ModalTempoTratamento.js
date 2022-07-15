import React from 'react'
import {Modal, View, StyleSheet, Text, TextInput, TouchableOpacity, FlatList} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

class ModalTempoTratamento extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {  
            icon: "check-box-outline-blank",
            qtd: this.props.qtd,
            editavel: true,
            continuo:this.props.continuo,
            tipoTempo:[],
            tipoSelected:{id:'d', nome:'dia(s)'},
         } 
        this.handleChange = this.handleChange.bind(this);
        this.changeIconCheck = this.changeIconCheck.bind(this);
    };

    componentDidMount() {
        if (this.props.continuo) {
            this.setState({ icon:"check-box",
                            editavel:false,
                            continuo:true,
                            tipoTempo:[]});

        } else {
            this.setState({ icon:"check-box-outline-blank",
                            editavel:true,
                            continuo:false});
        }
        this.setState({qtd:this.props.qtd})
    };

    selectListTipoTempo() {
        if (this.state.tipoTempo.length == 0) {
            this.setState({tipoTempo:[{id:'d', nome:'dia(s)'},{id:'s', nome:'semana(s)'}]});
        } else {
            this.setState({tipoTempo:[]});
        }
    };

    selectedTipoTempo(tipo) {
        this.setState({ tipoSelected:tipo,
                        tipoTempo:[]});
    }

    handleChange(text){
        this.setState({ qtd: text });
    };

    changeIconCheck(){
        if (this.state.icon == "check-box") {
            this.setState({ icon:"check-box-outline-blank",
                            editavel:true,
                            continuo:false,
                           });
        } else {
            this.setState({ icon:"check-box",
                            editavel:false,
                            continuo:true,
                            tipoTempo:[],
                            qtd:'0'  });
        }      
    }; 
  
    render () {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.props.visible}
                onRequestClose ={this.props.onRequestClose}
            >
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(256,256,256,0.5)'}}>
                        <View style = {styles.modalTempoTratamento}  >
                            <View style = {{alignItems:'center'}}>
                                <Text style = {{fontSize:18}}>Tempo de tratamento?</Text>
                                <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <TextInput style = {styles.inputTempoTratamento}
                                        keyboardType="number-pad"
                                        onTouchStart={() => this.setState({ qtd: '' })} 
                                        onEndEditing={this.state.qtd == '' ? () => this.setState({ qtd: '0' }) : console.log('')}
                                        value={this.state.qtd}
                                        editable={this.state.editavel}
                                        onChangeText={(text) =>this.handleChange(text)}
                                        maxLength={2}
                                    />
                                    <View style = {styles.selectTempo}>
                                        <TouchableOpacity onPress={() => this.selectListTipoTempo()} disabled={!this.state.editavel}>
                                            <Text style={{fontSize:17, textAlign:'left', fontWeight:'bold', color:'#222222'}}>
                                                {this.state.tipoSelected.nome}
                                            </Text>
                                            <MaterialIcons name={'arrow-drop-down'} size={26} color="#333333" style={styles.arrowSelect} />
                                        </TouchableOpacity>
                                        <FlatList
                                            style={{position:'absolute', top:45 , zIndex:5, alignSelf:'flex-start',width:'100%', elevation:4}}
                                            data={this.state.tipoTempo}
                                            renderItem={({item}) => {
                                                return (
                                                    <View style={{backgroundColor:'#ffffff', margin:0}} >
                                                        <TouchableOpacity style={{backgroundColor:'#ffffff', padding:10}} 
                                                            onPress={() => this.selectedTipoTempo(item)}>

                                                            <Text style={{fontSize:16}}>{item.nome}</Text>
                                                        </TouchableOpacity> 
                                                    </View>
                                                )
                                            }}/>
                                </View>
                                    
                                </View>
                            </View>
                            <View style = {{flexDirection: 'row', margin:20, alignItems:'center', justifyContent:'center', zIndex:1}}>
                                <MaterialIcons name={this.state.icon} size={26} color="black" onPress={() => this.changeIconCheck()} />
                                <Text style = {{fontSize:18}}> Uso contínuo. </Text>
                            </View>
                            <View style = {styles.separador} />                              
                            {this.props.children}
                    </View>
                </View>
            </Modal>
        );
    };
};

const styles = StyleSheet.create({
    modalTempoTratamento: {
        flex: 1,
        borderRadius:5,
        position: 'absolute',
        width: '80%',
        elevation:8,
        backgroundColor:'#fffff6',
        alignContent:'center',
        padding: 10,
        left: 40,
        top:120,
    },
    inputTempoTratamento: {
        backgroundColor:'#FEFEee', 
        textAlign:'center', 
        padding:4, 
        fontSize:28,
        width:'30%', 
        borderRadius:5, 
        borderBottomWidth:1,
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
        height:45,
        justifyContent:'center',
        zIndex:5,
        //borderBottomWidth:1,
    },
    arrowSelect:{
        position:'absolute',
        alignSelf:'flex-end',
    },
});

export default ModalTempoTratamento
