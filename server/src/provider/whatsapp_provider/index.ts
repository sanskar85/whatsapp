import { Types } from 'mongoose';
import Logger from 'n23-logger';
import QRCode from 'qrcode';
import { Socket } from 'socket.io';
import WAWebJS, { BusinessContact, Client, GroupChat, LocalAuth } from 'whatsapp-web.js';
import { CHROMIUM_PATH, SOCKET_RESPONSES } from '../../config/const';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import StorageDB from '../../repository/storage';
import { CampaignService } from '../../services';
import ApiKeyService from '../../services/keys';
import GroupMergeService from '../../services/merged-groups';
import { MessageLoggerService } from '../../services/message-logger';
import SchedulerService from '../../services/scheduler';
import { DeviceService, UserService } from '../../services/user';
import UserPreferencesService from '../../services/user/userPreferences';
import VoteResponseService from '../../services/vote-response';
import DateUtils from '../../utils/DateUtils';
import { Delay } from '../../utils/ExpressUtils';
import WhatsappUtils from '../../utils/WhatsappUtils';

type ClientID = string;
const PUPPETEER_ARGS = [
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--unhandled-rejections=strict',
	// '--disable-dev-shm-usage',
	// '--disable-accelerated-2d-canvas',
	// '--no-first-run',
	// '--no-zygote',
	// '--single-process', // <- this one doesn't works in Windows
	// '--disable-gpu',
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
}

export class WhatsappProvider {
	private client: Client;
	private client_id: ClientID;
	private static clientsMap = new Map<ClientID, WhatsappProvider>();
	private handledMessage = new Map<string, null>();

	private qrCode: string | undefined;
	private number: string | undefined;
	private contact: WAWebJS.Contact | undefined;
	private socket: Socket | undefined;
	private userService: UserService;
	private deviceService: DeviceService | undefined;
	private webhookService: ApiKeyService;
	private userPrefService: UserPreferencesService | undefined;
	private messageLoggerService: MessageLoggerService | undefined;

	private status: STATUS;

	private callbackHandlers: {
		onDestroy: (client_id: ClientID) => void;
	};

	private constructor(user: UserService, cid: ClientID) {
		this.userService = user;
		this.client_id = cid;
		this.webhookService = new ApiKeyService(user.getUserId());

		this.client = new Client({
			restartOnAuthFail: true,

			puppeteer: {
				headless: true,
				args: PUPPETEER_ARGS,
				executablePath: CHROMIUM_PATH,
			},

			authStrategy: new LocalAuth({
				clientId: this.client_id,
			}),
			webVersionCache: {
				type: 'remote',
				remotePath:
					'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
			},
		});

		this.status = STATUS.UNINITIALIZED;
		this.callbackHandlers = {
			onDestroy: () => {},
		};

		this.attachListeners();
		WhatsappProvider.clientsMap.set(this.client_id, this);
	}

	public static getInstance(user: UserService, client_id: ClientID) {
		if (!client_id) {
			throw new Error('Client Id Required');
		}
		if (WhatsappProvider.clientsMap.has(client_id)) {
			return WhatsappProvider.clientsMap.get(client_id)!;
		}

		return new WhatsappProvider(user, client_id);
	}

	public getClient() {
		return this.client;
	}

	public getClientID() {
		return this.client_id;
	}

	public async initialize() {
		if (this.status !== STATUS.UNINITIALIZED) return;
		Logger.info(
			`Initializing client`,
			`${this.userService.getUser().username} - ${this.client_id}`
		);
		this.client.initialize().catch((err) => {
			Logger.error('Error while initializing client', err as Error);
			DeviceService.logout(this.client_id);
			this.destroyClient();
			this.status = STATUS.DESTROYED;
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_CLOSED);
		});
		this.status = STATUS.INITIALIZED;
		this.sendToClient(SOCKET_RESPONSES.INITIALIZED, this.client_id);
	}

	private async attachListeners() {
		this.client.on('qr', async (qrCode) => {
			try {
				this.qrCode = await QRCode.toDataURL(qrCode);
				this.status = STATUS.QR_READY;

				this.sendToClient(SOCKET_RESPONSES.QR_GENERATED, this.qrCode);
			} catch (err) {}
		});

		this.client.on('authenticated', async () => {
			Logger.info(
				`Client Authenticated`,
				`${this.userService.getUser().username} - ${this.client_id}`
			);
			this.status = STATUS.AUTHENTICATED;
			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_AUTHENTICATED);
		});

		this.client.on('ready', async () => {
			/**
			 * 7032439268
7639621000
9836573777
9892050530
9669002600
			 */

			// this.client.

			// const _contact = await this.client.getContactById('7639621000@c.us');
			// const _chat = await this.contact?.getChat();
			// Logger.debug(_contact);

			try {
				Logger.info(`Client Ready`, `${this.userService.getUser().username} - ${this.client_id}`);
				this.number = this.client.info.wid.user;
				this.contact = await this.client.getContactById(this.client.info.wid._serialized);

				const business_details = this.contact.isBusiness
					? WhatsappUtils.getBusinessDetails(this.contact as BusinessContact)
					: {
							description: '',
							email: '',
							websites: [] as string[],
							latitude: 0,
							longitude: 0,
							address: '',
					  };

				this.userPrefService = await UserPreferencesService.getService(
					this.userService.getUserId()
				);

				this.messageLoggerService = new MessageLoggerService(this.number!, this.userPrefService!);

				this.deviceService = await DeviceService.createDevice({
					user: this.userService,
					name: this.client.info.pushname,
					phone: this.number,
					isBusiness: this.contact.isBusiness,
					business_details,
				});

				this.deviceService.setClientID(this.client_id);
				this.status = STATUS.READY;

				this.sendToClient(SOCKET_RESPONSES.WHATSAPP_READY);

				const paused_ids_campaigns = await StorageDB.getObject(
					`paused_campaigns_${this.userService.getUserId().toString()}`
				);
				const paused_ids_schedulers = await StorageDB.getObject(
					`paused_schedulers_${this.userService.getUserId().toString()}`
				);

				const campaignService = new CampaignService(this.userService.getUser());
				const schedulerService = new SchedulerService(this.userService.getUser());

				if (Array.isArray(paused_ids_campaigns) && paused_ids_campaigns.length > 0) {
					for (const campaign_id of paused_ids_campaigns) {
						campaignService.resumeCampaign(campaign_id);
					}
				}

				if (Array.isArray(paused_ids_schedulers) && paused_ids_schedulers.length > 0) {
					for (const scheduler_id of paused_ids_schedulers) {
						schedulerService.resume(scheduler_id);
					}
				}
			} catch (err) {
				Logger.error('Error while resuming campaigns and schedulers', err as Error);
			}
		});

		this.client.on('vote_update', async (vote) => {
			if (!vote.parentMessage.id?.fromMe) return;
			const vote_response_service = new VoteResponseService(this.userService.getUser());
			const pollDetails = vote_response_service.getPollDetails(vote.parentMessage);
			try {
				const contact = await this.client.getContactById(vote.voter);
				if (!this.contact || contact.id._serialized === this.contact.id._serialized) {
					return;
				}
				const details = {
					...pollDetails,
					voter_number: '',
					voter_name: '',
					group_name: '',
					selected_option: vote.selectedOptions.map((opt: { name: string }) => opt.name),
					voted_at: DateUtils.getMoment(vote.interractedAtTs).toDate(),
				};

				const chat = await this.client.getChatById(pollDetails.chat_id);
				if (chat.isGroup) {
					details.group_name = chat.name;
				}

				details.voter_number = contact.number;
				details.voter_name = (contact.name || contact.pushname) ?? '';

				await vote_response_service.saveVote(details);
				details.selected_option.map((opt: string) => {
					this.deviceService!.handleMessage({
						triggered_from: chat.id._serialized,
						body: opt,
						contact,
						isGroup: chat.isGroup,
						fromPoll: true,
						client_id: this.client_id,
						message_id: 'VOTE UPDATE',
					});
				});
			} catch (err) {}
		});

		this.client.on('disconnected', async () => {
			Logger.info(
				`Client Disconnected`,
				`${this.userService.getUser().username} - ${this.client_id}`
			);
			this.status = STATUS.DISCONNECTED;

			this.deviceService?.logout();
			this.logoutClient();

			this.sendToClient(SOCKET_RESPONSES.WHATSAPP_CLOSED);

			const paused_ids_campaigns = new CampaignService(this.userService.getUser()).pauseAll();
			const paused_ids_schedulers = new SchedulerService(this.userService.getUser()).pauseAll();

			await StorageDB.setObject(
				`paused_campaigns_${this.userService.getUserId().toString()}`,
				paused_ids_campaigns
			);
			await StorageDB.setObject(
				`paused_schedulers_${this.userService.getUserId().toString()}`,
				paused_ids_schedulers
			);
		});

		this.client.on('message', async (_message) => {
			if (!this.deviceService) {
				return;
			}
			if (this.handledMessage.has(_message.id._serialized)) {
				return;
			}

			const message = await this.client.getMessageById(_message.id._serialized);

			if (!message) {
				return;
			}
			const contact = await message.getContact();
			const chat = await message.getChat();

			const isGroup = chat.isGroup;

			if (message.body) {
				this.handledMessage.set(message.id._serialized, null);
				if (!this.contact || contact.id._serialized === this.contact.id._serialized) {
					return;
				}

				this.deviceService!.handleMessage({
					triggered_from: message.from,
					body: message.body,
					contact,
					isGroup,
					fromPoll: false,
					client_id: this.client_id,
					message_id: message.id._serialized,
				});
				if (isGroup) {
					const groupService = new GroupMergeService(this.userService.getUser());
					groupService.sendGroupReply(this.client, {
						chat: chat as GroupChat,
						message,
						contact,
						deviceService: this.deviceService!,
					});
				} else {
					// if (this.userPrefService!.isMessageStarEnabled()) {
					// 	_message.star();
					// }
				}
			} else {
				this.deviceService!.handleMessage({
					triggered_from: message.from,
					body: '',
					contact,
					isGroup,
					fromPoll: false,
					client_id: this.client_id,
					message_id: message.id._serialized,
				});
			}
			if (this.userPrefService!.isLoggerEnabled()) {
				this.messageLoggerService!.handleMessage({
					message,
					contact,
					chat,
				});
			}

			if (this.userPrefService?.getMessageStarRules().individual_incoming_messages && !isGroup) {
				message.star();
			} else if (
				this.userPrefService?.getMessageStarRules().group_incoming_messages &&
				chat.isGroup
			) {
				message.star();
			}

			this.webhookService.sendWebhook({
				recipient: contact.id.user,
				recipient_name: contact.pushname || contact.name,
				chat_id: chat.id._serialized,
				chat_name: chat.name,
				message,
			});
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

	public getContact() {
		if (!this.contact) {
			throw new InternalError(INTERNAL_ERRORS.WHATSAPP_ERROR.WHATSAPP_NOT_READY);
		}
		return this.contact;
	}

	public isReady() {
		return this.status === STATUS.READY;
	}
	public getStatus() {
		return this.status;
	}
	public isBusiness() {
		return this.getContact().isBusiness;
	}

	async logoutClient() {
		this.deviceService?.logout();
		WhatsappProvider.clientsMap.delete(this.client_id);
		await Delay(10);
		WhatsappProvider.deleteSession(this.client_id);
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
		WhatsappProvider.clientsMap.delete(this.client_id);

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

	getDeviceService() {
		return this.deviceService;
	}

	onDestroy(func: (client_id: ClientID) => void) {
		this.callbackHandlers.onDestroy = func;
	}

	static deleteSession(client_id: string) {
		WhatsappProvider.clientsMap.delete(client_id);
	}

	static getInstancesCount(): number {
		return WhatsappProvider.clientsMap.size;
	}

	static clientByClientID(id: string) {
		return WhatsappProvider.clientsMap.get(id);
	}

	static clientByUser(id: Types.ObjectId) {
		for (const [cid, client] of WhatsappProvider.clientsMap.entries()) {
			if (!client.isReady()) continue;
			if (client.userService.getUserId().toString() === id.toString()) {
				return cid;
			}
		}
		return null;
	}

	// public static getClient(account: IAccount) {
	// 	const client_id = this.clientByUser(account._id.toString());
	// 	if (!client_id) {
	// 		return null;
	// 	}
	// 	return WhatsappProvider.clientByClientID(client_id);
	// }
}
