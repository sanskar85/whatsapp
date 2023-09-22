import { PRIVACY_TYPE } from '../config/const';

declare const chrome: any;

export async function getActiveTabURL() {
	const tabs = await chrome.tabs.query({
		currentWindow: true,
		active: true,
	});

	return tabs[0];
}

export function resetChromeData() {
	chrome.storage.sync.set({
		[PRIVACY_TYPE.RECENT]: false,
		[PRIVACY_TYPE.NAME]: false,
		[PRIVACY_TYPE.PHOTO]: false,
		[PRIVACY_TYPE.CONVERSATION]: false,
	});
}

export function saveChromeData(key: keyof typeof PRIVACY_TYPE|string, data: boolean) {
	chrome.storage.sync.set({
		[key]: data,
	});
}

export function getChromeData(key: keyof typeof PRIVACY_TYPE) {
	return new Promise((resolve: (hidden: boolean) => void, reject) => {
		chrome.storage.sync.get(key, (data: any) => {
			if (chrome.runtime.lastError) {
				return resolve(false);
			} else {
				return resolve(data[key] as boolean);
			}
		});
	});
}
