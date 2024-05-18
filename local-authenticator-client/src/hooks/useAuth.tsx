import { useState } from 'react';
import { singletonHook } from 'react-singleton-hook';
import { io } from 'socket.io-client';
import { SERVER_URL, SOCKET_EVENT } from '../config/const';

const initStatus = {
	isAuthenticated: false,
	isAuthenticating: false,
	qrCode: '',
	qrGenerated: false,
	isSocketInitialized: false,
	isServerSessionStarted: false,
	isServerSessionFailed: false,
};
let globalSet: React.Dispatch<
	React.SetStateAction<{
		isAuthenticated: boolean;
		isAuthenticating: boolean;
		qrCode: string;
		qrGenerated: boolean;
		isSocketInitialized: boolean;
		isServerSessionStarted: boolean;
		isServerSessionFailed: boolean;
	}>
> = () => {
	throw new Error('you must useAuth before setting its state');
};

const socket = io(SERVER_URL + 'auth');

export const useAuth = singletonHook(initStatus, () => {
	const [auth, setAuth] = useState(initStatus);
	globalSet = setAuth;

	return {
		isAuthenticated: auth.isAuthenticated,
		isAuthenticating: auth.isAuthenticating,
		qrCode: auth.qrCode,
		qrGenerated: auth.qrGenerated,
		isSocketInitialized: auth.isSocketInitialized,
		isServerSessionStarted: auth.isServerSessionStarted,
		isServerSessionFailed: auth.isServerSessionFailed,
	};
});

export const setAuth = (data: Partial<typeof initStatus>) =>
	globalSet((prev) => ({ ...prev, ...data }));

socket.on(SOCKET_EVENT.SERVER_SESSION_FAILED, () => {
	setAuth({
		isAuthenticated: true,
		isAuthenticating: false,
		qrCode: '',
		qrGenerated: false,
		isSocketInitialized: true,
		isServerSessionStarted: false,
		isServerSessionFailed: true,
	});
});

socket.on(SOCKET_EVENT.SERVER_SESSION_STARTED, () => {
	setAuth({
		isAuthenticated: true,
		isAuthenticating: false,
		qrCode: '',
		qrGenerated: false,
		isSocketInitialized: true,
		isServerSessionStarted: true,
		isServerSessionFailed: false,
	});
});

socket.on(SOCKET_EVENT.WHATSAPP_READY, () => {
	setAuth({
		isAuthenticated: true,
		isAuthenticating: false,
		qrCode: '',
		qrGenerated: false,
		isSocketInitialized: true,
		isServerSessionStarted: false,
		isServerSessionFailed: false,
	});
});

socket.on(SOCKET_EVENT.WHATSAPP_AUTHENTICATED, () => {
	setAuth({
		isAuthenticated: true,
		isAuthenticating: false,
		qrCode: '',
		qrGenerated: false,
		isSocketInitialized: false,
		isServerSessionStarted: false,
		isServerSessionFailed: false,
	});
});

socket.on(SOCKET_EVENT.WHATSAPP_CLOSED, () => {
	setAuth({
		isAuthenticated: false,
		isAuthenticating: false,
		qrCode: '',
		qrGenerated: false,
		isServerSessionStarted: false,
		isServerSessionFailed: false,
	});
});
socket.on('disconnect', async () => {
	setAuth(initStatus);
});

socket.on(SOCKET_EVENT.QR_GENERATED, (...args) => {
	setAuth({
		qrCode: args[0],
		isAuthenticating: true,
		qrGenerated: true,
		isSocketInitialized: false,
		isAuthenticated: false,
		isServerSessionStarted: false,
		isServerSessionFailed: false,
	});
});

export const startAuth = async (username: string) => {
	setAuth({
		isAuthenticating: true,
		qrGenerated: false,
		isSocketInitialized: false,
		isAuthenticated: false,
		qrCode: '',
		isServerSessionStarted: false,
		isServerSessionFailed: false,
	});
	socket.emit(SOCKET_EVENT.INITIALIZE, username);
};
