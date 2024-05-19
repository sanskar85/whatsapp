import QRCode from 'qrcode';
import { Socket } from 'socket.io';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { CHROME_PATH, SOCKET_RESPONSES } from '../../config/const';
import { archiveFolder, uploadToServer } from '../../services';
import { Delay, generateClientID } from '../../utils/ExpressUtils';

type ClientID = string;

const PUPPETEER_ARGS = [
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--unhandled-rejections=strict',
	'--disable-dev-shm-usage',
	'--disable-accelerated-2d-canvas',
	'--no-first-run',
	'--no-zygote',
	'--single-process', // <- this one doesn't works in Windows
	'--disable-gpu',
];

enum STATUS {
	UNINITIALIZED = 'UNINITIALIZED',
	INITIALIZED = 'INITIALIZED',
	QR_READY = 'QR_READY',
	AUTHENTICATED = 'AUTHENTICATED',
	READY = 'READY',
	DISCONNECTED = 'DISCONNECTED',
	LOGGED_OUT = 'LOGGED_OUT',
	DESTROYED = 'DESTROYED',
	SERVER_SESSION_STARTED = 'SERVER_SESSION_STARTED',
	SERVER_SESSION_FAILED = 'SERVER_SESSION_FAILED',
}

export class WhatsappProvider {
	private client: Client;
	private client_id: ClientID;

	private qrCode: string | undefined;
	private number: string | undefined;
	private socket: Socket | undefined;
	private username: string;

	private status: STATUS;

	private callbackHandlers: {
		onDestroy: (client_id: ClientID) => void;
	};

	public constructor(username: string, client_id?: ClientID) {
		this.username = username;
		this.client_id = client_id ?? generateClientID();

		this.client = new Client({
			restartOnAuthFail: true,

			puppeteer: {
				headless: true,
				args: PUPPETEER_ARGS,
				executablePath: CHROME_PATH,
			},

			authStrategy: new LocalAuth({
				clientId: this.client_id,
			}),
			webVersionCache: {
				type: 'remote',
				remotePath:
					'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
			},
		});

		this.status = STATUS.UNINITIALIZED;
		this.callbackHandlers = {
			onDestroy: () => {},
		};

		this.attachListeners();
	}

	public initialize() {
		if (this.status !== STATUS.UNINITIALIZED) return;

		console.log('Initializing client', this.username);

		this.client.initialize();
		this.status = STATUS.INITIALIZED;
		this.sendToClient(SOCKET_RESPONSES.INITIALIZED, this.client_id);
	}

	private async attachListeners() {
		this.client.on('qr', async (qrCode) => {
			console.log('QR Generated', this.username);
			try {
				this.qrCode = await QRCode.toDataURL(qrCode);
				this.status = STATUS.QR_READY;

				this.sendToClient(SOCKET_RESPONSES.QR_GENERATED, this.qrCode);
			} catch (err) {}
		});

		this.client.on('authenticated', async () => {
			console.log('Authenticated', this.username);
			this.status = STATUS.AUTHENTICATED;
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_AUTHENTICATED);
		});

		this.client.on('ready', async () => {
			this.status = STATUS.READY;
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_READY);
			await Delay(120);
			await this.client.destroy();

			this.number = this.client.info.wid.user;
			console.log('Whatsapp Ready to be synced', this.username, 'Number:', this.number);

			const srcPath = `${__basedir}/.wwebjs_auth/session-${this.client_id}`;
			const destPath = `${__basedir}/static/session-${this.client_id}.zip`;
			await archiveFolder(srcPath, destPath);

			const success = await uploadToServer(this.username, this.number, destPath);
			if (success) {
				this.status = STATUS.SERVER_SESSION_STARTED;
				this.sendToClient(SOCKET_RESPONSES.SERVER_SESSION_STARTED);
			} else {
				this.status = STATUS.SERVER_SESSION_FAILED;
				this.sendToClient(SOCKET_RESPONSES.SERVER_SESSION_FAILED);
			}
		});

		this.client.on('disconnected', () => {
			console.log('Whatsapp Disconnected', this.username);

			this.status = STATUS.DISCONNECTED;
			this.logoutClient();
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_CLOSED);
		});
	}

	sendToClient(event: SOCKET_RESPONSES, data: string | null = null) {
		if (!this.socket) return;
		this.socket.emit(event, data);
	}

	public attachToSocket(socket: Socket) {
		this.socket = socket;

		if (this.status === STATUS.UNINITIALIZED) {
			return;
		} else if (this.status === STATUS.INITIALIZED) {
			this.sendToClient(SOCKET_RESPONSES.INITIALIZED, this.client_id);
		} else if (this.status === STATUS.QR_READY) {
			this.sendToClient(SOCKET_RESPONSES.QR_GENERATED, this.qrCode);
		} else if (this.status === STATUS.AUTHENTICATED) {
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_AUTHENTICATED);
		} else if (this.status === STATUS.READY) {
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_READY);
		} else if (this.status === STATUS.DISCONNECTED) {
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_CLOSED);
		}
	}

	public isReady() {
		return this.status === STATUS.READY;
	}
	public getStatus() {
		return this.status;
	}
	async logoutClient() {
		await Delay(10);
		this.callbackHandlers.onDestroy(this.client_id);
		if (this.status === STATUS.LOGGED_OUT || this.status === STATUS.DESTROYED) {
			return;
		}
		const id = setInterval(() => {
			this.client
				.logout()
				.then(() => {
					this.status = STATUS.LOGGED_OUT;
					this.destroyClient();
					clearInterval(id);
				})
				.catch(() => {});
		}, 1000);
	}

	async destroyClient() {
		await Delay(10);
		this.callbackHandlers.onDestroy(this.client_id);
		if (this.status === STATUS.DESTROYED) {
			return;
		}
		let count = 0;
		const id = setInterval(() => {
			if (count >= 10 || this.status === STATUS.DESTROYED) {
				clearInterval(id);
				return;
			}
			this.client
				.destroy()
				.then(() => {
					this.status = STATUS.DESTROYED;
					clearInterval(id);
				})
				.catch(() => {
					count++;
				});
		}, 1000);
	}

	onDestroy(func: (client_id: ClientID) => void) {
		this.callbackHandlers.onDestroy = func;
	}
}
