import Logger from 'n23-logger';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '../../config/const';
import { LoginCredentialsTemplate, PasswordResetTemplate } from './templates';

const resend = new Resend(RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, token: string) {
	const { error } = await resend.emails.send({
		from: 'Whatsleads <no-reply@whatsleads.in>',
		to: [to],
		subject: 'Password reset request for Whatsleads',
		html: PasswordResetTemplate(token),
	});

	if (error) {
		Logger.error('Resend Error', error, { ...error, details: 'Error Sending reset message' });
		return false;
	}
	return true;
}

export async function sendLoginCredentialsEmail(to: string, username: string, password: string) {
	const { error } = await resend.emails.send({
		from: 'Whatsleads <no-reply@whatsleads.in>',
		to: [to],
		subject: 'Login Credentials for Whatsleads',
		html: LoginCredentialsTemplate(username, password),
	});

	if (error) {
		Logger.error('Resend Error', error, { ...error, details: 'Error Sending reset message' });
		return false;
	}
	return true;
}
