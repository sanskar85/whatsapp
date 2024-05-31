import { io } from 'socket.io-client';
import { LOCAL_SERVER_URL } from './const';

const socket = io(LOCAL_SERVER_URL);
export default socket;
