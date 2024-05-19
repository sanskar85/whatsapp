import * as http from 'http';
import { Socket, Server as SocketServer } from 'socket.io';
import { SOCKET_EVENTS } from '../../config/const';
import { WhatsappProvider } from '../whatsapp_provider';

type WhatsappClientID = string;
type SocketID = string;

export default class SocketServerProvider {
	private static instance: SocketServerProvider;
	private io: SocketServer;

	private static clientsMap = new Map<WhatsappClientID, WhatsappProvider>();
	private static socketsMap = new Map<SocketID, WhatsappClientID>();

	private constructor(server: http.Server) {
		this.io = new SocketServer(server, {
			cors: {
				origin: '*',
			},
		});
		this.attachListeners();
	}

	public static getInstance(server: http.Server): SocketServerProvider {
		if (!SocketServerProvider.instance) {
			SocketServerProvider.instance = new SocketServerProvider(server);
		}

		return SocketServerProvider.instance;
	}

	private attachListeners() {
		this.io.of('/auth').on('connection', (socket) => {
			socket.on(SOCKET_EVENTS.INITIALIZE, async (username: string | undefined) => {
				if (username) {
					SocketServerProvider.socketsMap.set(socket.id, username);
					this.initializeWhatsappClient(socket, username);
				}
			});
			socket.on('disconnect', () => {
				const provider = SocketServerProvider.clientsMap.get(
					SocketServerProvider.socketsMap.get(socket.id)!
				);
				if (provider) {
					provider.destroyClient();
				}
				SocketServerProvider.socketsMap.delete(socket.id);
			});
		});
	}

	private initializeWhatsappClient(socketClient: Socket, username: string) {
		const whatsappInstance = new WhatsappProvider(username);

		if (!whatsappInstance) {
			return;
		}
		whatsappInstance.initialize();
		whatsappInstance.attachToSocket(socketClient);
		whatsappInstance.onDestroy(function (username) {
			SocketServerProvider.clientsMap.delete(username);
		});
		SocketServerProvider.clientsMap.set(username, whatsappInstance);
	}
}
