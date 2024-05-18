export const DATABASE_URL = process.env.DATABASE_URL as string;

export const IS_WINDOWS = process.env.OS === 'WINDOWS';

export const IS_PRODUCTION = process.env.MODE === 'production';

export const PORT = process.env.PORT !== undefined ? process.env.PORT : undefined;

export const SERVER_URL = process.env.SERVER_URL ?? 'localhost:8282';

export enum SOCKET_EVENTS {
	INITIALIZE = 'initialize',
}

export enum UserRoles {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

export enum SOCKET_RESPONSES {
	INITIALIZED = 'initialized',
	QR_GENERATED = 'qr-generated',
	WHATSAPP_AUTHENTICATED = 'whatsapp-authenticated',
	WHATSAPP_READY = 'whatsapp-ready',
	WHATSAPP_CLOSED = 'whatsapp-closed',
	SERVER_SESSION_STARTED = 'server-session-started',
	SERVER_SESSION_FAILED = 'server-session-failed',
}
