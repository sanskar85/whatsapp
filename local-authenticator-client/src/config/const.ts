export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export enum SOCKET_EVENT {
	INITIALIZE = 'initialize',
	INITIALIZED = 'initialized',
	QR_GENERATED = 'qr-generated',
	WHATSAPP_AUTHENTICATED = 'whatsapp-authenticated',
	WHATSAPP_READY = 'whatsapp-ready',
	WHATSAPP_CLOSED = 'whatsapp-closed',
	SERVER_SESSION_STARTED = 'server-session-started',
	SERVER_SESSION_FAILED = 'server-session-failed',
}

export enum Colors {
	ACCENT_LIGHT = '#E8F2ED',
	ACCENT_DARK = '#4F966E',
	PRIMARY_DARK = '#0D1C12',
	BACKGROUND_LIGHT = '#F7FCFA',
}
