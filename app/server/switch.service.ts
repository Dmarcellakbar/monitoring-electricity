/* eslint-disable */

import axios from 'axios';

const API_URL = 'https://nodered.hardiot.my.id/switchpower';

const API_URL_2 = 'https://nodered.hardiot.my.id/switchchangevalue';



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


export const getHistoricalData = async (type: string) => {
    try {
        const response = await axios.get(`https://nodered.hardiot.my.id/data-history?params=${encodeURIComponent(type)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
};
