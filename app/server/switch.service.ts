import axios from 'axios';

const API_URL = 'http://165.154.208.223:8070/switchpower';

const API_URL_2 = 'http://165.154.208.223:8070/switchchangevalue';


export const postSwitchPower = async (name: any, value: any, id: any) => {
    try {
        const response = await axios.post(API_URL, {
            id_sensor: id,
            name,
            value
        });
        return response.data;
    } catch (error) {
        console.error('Error posting data:', error);
        throw error;
    }
};


export const postValueSwitchPower = async (name: any, value: any, id: any) => {
    try {
        const response = await axios.post(API_URL_2, {
            id_sensor: id,
            name,
            value
        });
        return response.data;
    } catch (error) {
        console.error('Error posting data:', error);
        throw error;
    }
};
