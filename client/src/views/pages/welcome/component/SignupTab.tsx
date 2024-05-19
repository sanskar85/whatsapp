import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { CAPTCHA_KEY, Colors } from '../../../../config/const';
import { useAuth } from '../../../../hooks/useAuth';
import AuthService from '../../../../services/auth.service';

export default function SignupTab() {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const { isAuthenticating } = useAuth();
	const [{ username }, setCredentials] = useState({
		username: '',
	});

	const [{ usernameError, loginError }, setUIDetails] = useState({
		usernameError: false,
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
		if (!username) {
			return setUIDetails({
				usernameError: !username,
				loginError: false,
			});
		}

		const error = await AuthService.register(username);
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
							Full Name
						</FormLabel>
						<Input
							type='text'
							variant='unstyled'
							bgColor={Colors.ACCENT_LIGHT}
							placeholder='full name'
							_placeholder={{
								color: Colors.ACCENT_DARK,
								opacity: 0.7,
							}}
							borderColor={Colors.ACCENT_DARK}
							borderWidth={'1px'}
							padding={'0.5rem'}
						/>
					</FormControl>
					<FormControl isInvalid={usernameError}>
						<FormLabel htmlFor='email' color={Colors.PRIMARY_DARK}>
							Email
						</FormLabel>
						<Input
							type='email'
							name='email'
							value={username}
							variant='unstyled'
							bgColor={Colors.ACCENT_LIGHT}
							onChange={handleChange}
							placeholder='email'
							_placeholder={{
								color: usernameError ? 'red.400' : Colors.ACCENT_DARK,
								opacity: 0.7,
							}}
							borderColor={usernameError ? 'red' : Colors.ACCENT_DARK}
							borderWidth={'1px'}
							padding={'0.5rem'}
						/>
					</FormControl>
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
				<Box>
					<ReCAPTCHA
						ref={recaptchaRef}
						size='invisible'
						sitekey={CAPTCHA_KEY}
						style={{
							display: 'none',
						}}
					/>
				</Box>
			</Stack>
		</>
	);
}
