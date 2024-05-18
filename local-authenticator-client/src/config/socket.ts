import { io } from 'socket.io-client';
import { SERVER_URL } from './const';

const socket = io(SERVER_URL);
export default socket;
