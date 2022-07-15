import React from 'react';
import {View, Modal, StyleSheet, Text, TouchableOpacity, FlatList} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

class ModalDataInicio extends React.PureComponent {

    constructor (props) {
        super(props);

        this.state = { 
            selectedDate: new Date(),
            diaSemana:{id:'0',nome:'Dom.'},

            showPicker:false,
            modePicker:'',

         };

         this.selectDiaSemana = [{id:'0',nome:'Dom.'},{id:'1',nome:'Seg.'},
                                    {id:'2',nome:'Ter.'},{id:'3',nome:'Qua.'},
                                    {id:'4',nome:'Qui.'},{id:'5',nome:'Sex.'}, 
                                    {id:'6',nome:'Sab.'}];
         
    };

    componentDidMount() {
        moment.locale('pt')

    };

    listDate(item) {
        this.setState({
            modePicker:item,
            showPicker:true,
            });

    };

    selectDate = (event,dateChoose) => {
        const selectedDate = dateChoose;   
        this.setState({
            selectedDate:selectedDate,
            modePicker:'',
            showPicker:false,
        });
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
                <View style={styles.modalTempoTratamento}>
                    
                    <Text style={{fontWeight:'bold'}}>Qual a data e hora de início do tratamento?</Text>
                    
                    <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>                   
                        <View style={{width: '66%'}}>
                            <TouchableOpacity style={[styles.btnSelectedItem]} onPress={() => this.listDate('date')} >
                                <Text style={styles.textSelectedItem}>{this.state.diaSemana.nome + ' ' + moment(this.state.selectedDate).format('DD/MMM/YYYY')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.textSelectedItem,{width: '2%'}]}>{' '}</Text>
                        <View style={[{width: '32%'}]}>
                            <TouchableOpacity style={[styles.btnSelectedItem]} onPress={() => this.listDate('time')}>
                                <Text style={styles.textSelectedItem}>{moment(this.state.selectedDate).format('HH:mm') }</Text>
                            </TouchableOpacity>
                        </View>
                        {this.state.showPicker && (
          
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={this.state.selectedDate}
                                mode={this.state.modePicker}
                                is24Hour={true}
                                onChange={this.selectDate}
                                minimumDate={new Date()}           
                            />          
                            )}
                    </View>
                    
                    <View style = {styles.separador} />
                    {this.props.children}
                </View>
            </View>
        </Modal>
      );

}};

const styles = StyleSheet.create({
    modalTempoTratamento: {
        backgroundColor:'#fffff6',
        position: 'absolute',
        alignContent:'center',
        alignItems:'center',
        justifyContent:'center',
        elevation:8,
        borderRadius:5,
        padding: 10,
        width: '90%',
        top:120,
    },
    btnSelectedItem: {
        backgroundColor:'#FEFEee',
        padding: 5  ,
        borderRadius:4,
    },
    textSelectedItem: {
        fontSize:22, 
        textAlign:'center', 
        textAlignVertical:'center'
    },
    separador: {
        backgroundColor:'#aaaaaa', 
        height:1.5, 
        width:'95%',
        marginTop: 5,
      },
      flatListSelect: {
        position:'absolute', 
        height:150, 
        width:'100%', 
        zIndex:2, 
        top:40
      }
});

export default ModalDataInicio
