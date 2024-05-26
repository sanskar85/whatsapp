import moment from 'moment';

const getDate = (format = 'YYYY-MM-DD') => {
	return moment().format(format);
};

const getMonth = () => {
	return moment().format('MM');
};

const getMonthName = () => {
	return moment().format('MMM');
};

const getYear = () => {
	return moment().format('YYYY');
};

const getMonthYear = () => {
	return moment().format('YYYY-MM');
};

const dateTime = () => {
	return moment().format('YYYY-MM-DD HH:mm:ss');
};

const now = (): number => {
	return moment().milliseconds();
};

const format = (date: Date | number, format = 'DD-MM-YYYY HH:mm:ss'): string => {
	return moment(date).format(format);
};

const getMoment = (date: string | Date | number, format: string | null = null) => {
	if (format === null) {
		return moment(date);
	}
	return moment(date, format);
};

const getUnixMoment = (date: number) => {
	return moment.unix(date);
};

const isValid = (date: string | Date, format: string | null = null) => {
	if (typeof date !== 'string' || format === null) {
		return moment(date).isValid();
	}
	return moment(date, format, true).isValid();
};

const getMomentNow = () => {
	return moment();
};

const getLocalTime = (date: Date | number, format = 'YYYY-MM-DDTHH:mm:ss.SSSZ') => {
	const instance = moment(date);
	if (instance.isUTC()) {
		instance.utcOffset(330);
		return instance.format(format);
	}
	return moment(date).local().format(format);
};

function isTimeBetween(
	startTime: string | moment.Moment,
	endTime: string | moment.Moment,
	targetTime: string | moment.Moment
): boolean {
	const start = moment(startTime, 'HH:mm');
	const end = moment(endTime, 'HH:mm');
	const target = moment(targetTime, 'HH:mm');
	start.set({
		year: target.year(),
		month: target.month(),
		date: target.date(),
	});
	end.set({
		year: target.year(),
		month: target.month(),
		date: target.date(),
	});
	return target.isBetween(start, end, null, '[]'); // '[]' includes both start and end times
}

function getBetween(start: string | moment.Moment, end: string | moment.Moment) {
	const startTime = moment(start, 'HH:mm:ss');
	const endTime = moment(end, 'HH:mm:ss');

	// Calculate the difference in milliseconds between start and end times
	const timeDifference = endTime.diff(startTime);

	// Generate a random time within the range
	const randomTimeInMillis = Math.floor(Math.random() * timeDifference);

	// Add the random time to the start time
	const randomTime = startTime.clone().add(randomTimeInMillis, 'milliseconds');

	// Format the result as a string (e.g., 'HH:mm:ss')
	return randomTime;
}

export default {
	getDate,
	getMonth,
	getYear,
	getMonthYear,
	getMonthName,
	dateTime,
	isValid,
	now,
	format,
	getMoment,
	getMomentNow,
	getLocalTime,
	isTimeBetween,
	getBetween,
	getUnixMoment,
};
