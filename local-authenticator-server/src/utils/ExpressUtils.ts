import crypto from 'crypto';

export const Delay = async (seconds: number) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(null);
		}, seconds * 1000);
	});
};

export function generateClientID() {
	return crypto.randomUUID();
}
