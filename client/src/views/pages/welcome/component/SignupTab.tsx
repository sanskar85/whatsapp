import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { CAPTCHA_KEY, Colors } from '../../../../config/const';
import { useAuth } from '../../../../hooks/useAuth';
import AuthService from '../../../../services/auth.service';
import { PasswordInput } from './PasswordInput';

export default function SignupTab() {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const { isAuthenticating } = useAuth();
	const [{ username, password, confirm_password }, setCredentials] = useState({
		username: '',
		password: '',
		confirm_password: '',
	});

	const [{ usernameError, passwordError, loginError, confirm_passwordError }, setUIDetails] =
		useState({
			usernameError: false,
			passwordError: false,
			confirm_passwordError: false,
			loginError: false,
		});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCredentials((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
		setUIDetails((prev) => ({
			...prev,
			loginError: false,
			[e.target.name + 'Error']: false,
		}));
	};

	const handleSignup = async () => {
		await recaptchaRef.current?.executeAsync();
		if (!username || !password || !confirm_password) {
			return setUIDetails({
				usernameError: !username,
				passwordError: !password,
				confirm_passwordError: !confirm_password,
				loginError: false,
			});
		}

		if (password !== confirm_password) {
			return setUIDetails((prev) => ({
				...prev,
				passwordError: true,
				confirm_passwordError: true,
			}));
		}

		const error = await AuthService.register(username, password);
		if (!error) {
			return;
		}
		setUIDetails((prev) => ({
			...prev,
			usernameError: error,
			loginError: error,
		}));
	};
	return (
		<>
			<Stack width={'full'} spacing='6'>
				<Stack spacing='2'>
					<FormControl isInvalid={usernameError}>
						<FormLabel htmlFor='email' color={Colors.PRIMARY_DARK}>
							Username
						</FormLabel>
						<Input
							type='email'
							name='username'
							value={username}
							variant='unstyled'
							bgColor={Colors.ACCENT_LIGHT}
							onChange={handleChange}
							placeholder='username'
							_placeholder={{
								color: usernameError ? 'red.400' : Colors.ACCENT_DARK,
								opacity: 0.7,
							}}
							borderColor={usernameError ? 'red' : Colors.ACCENT_DARK}
							borderWidth={'1px'}
							padding={'0.5rem'}
						/>
					</FormControl>
					<PasswordInput
						isInvalid={passwordError}
						name='password'
						value={password}
						onChange={handleChange}
						placeholder='********'
					/>
					<PasswordInput
						label='Confirm Password'
						isInvalid={confirm_passwordError}
						name='confirm_password'
						value={confirm_password}
						onChange={handleChange}
						placeholder='********'
					/>
				</Stack>

				<Stack spacing='0'>
					<Text color={'red'} textAlign={'center'}>
						{loginError}
					</Text>
					<Button
						onClick={handleSignup}
						colorScheme={loginError ? 'red' : 'green'}
						isLoading={isAuthenticating}
					>
						Sign Up
					</Button>
				</Stack>
				<Box display={'none'}>
					<ReCAPTCHA ref={recaptchaRef} size='invisible' sitekey={CAPTCHA_KEY} />
				</Box>
			</Stack>
		</>
	);
}
