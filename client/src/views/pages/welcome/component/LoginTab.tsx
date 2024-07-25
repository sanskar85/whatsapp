import {
	Button,
	Center,
	FormControl,
	FormLabel,
	Input,
	Stack,
	Text,
	useToast,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';
import { CAPTCHA_KEY, Colors, NAVIGATION } from '../../../../config/const';
import { useAuth } from '../../../../hooks/useAuth';
import AuthService from '../../../../services/auth.service';
import { PasswordInput } from './PasswordInput';

export default function LoginTab() {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const navigate = useNavigate();
	const toast = useToast();
	const { isAuthenticating } = useAuth();
	const [{ username, password }, setCredentials] = useState({
		username: '',
		password: '',
	});

	const [{ usernameError, passwordError, loginError }, setUIDetails] = useState({
		usernameError: false,
		passwordError: false,
		loginError: false,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCredentials((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
		setUIDetails((prev) => ({
			...prev,
			[e.target.name + 'Error']: false,
		}));
	};

	const forgotPassword = async () => {
		const token = await recaptchaRef.current?.executeAsync();
		if (!token) {
			return;
		}
		if (!username) {
			return setUIDetails({
				usernameError: !username,
				passwordError: false,
				loginError: false,
			});
		}
		const valid = await AuthService.forgotPassword(username);
		if (valid) {
			toast({
				title: 'Password reset link sent to your email',
				status: 'success',
				duration: 4000,
				isClosable: true,
			});
		}
		setUIDetails({
			passwordError: false,
			usernameError: true,
			loginError: false,
		});
		setTimeout(() => {
			setUIDetails({
				passwordError: false,
				usernameError: false,
				loginError: false,
			});
		}, 5000);
	};

	const handleLogin = async () => {
		const token = await recaptchaRef.current?.executeAsync();
		if (!token) {
			return;
		}
		if (!username || !password) {
			return setUIDetails({
				usernameError: !username,
				passwordError: !password,
				loginError: false,
			});
		}
		const valid = await AuthService.login(username, password);
		if (valid) {
			return navigate(NAVIGATION.HOME);
		}
		setUIDetails({
			passwordError: true,
			usernameError: true,
			loginError: true,
		});
		setTimeout(() => {
			setUIDetails({
				passwordError: false,
				usernameError: false,
				loginError: false,
			});
		}, 2000);
	};

	return (
		<>
			<Stack width={'full'} spacing='6'>
				<Stack spacing='3'>
					<FormControl isInvalid={usernameError}>
						<FormLabel htmlFor='email' color={Colors.PRIMARY_DARK}>
							Username or Email
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
							marginTop={'-0.5rem'}
						/>
					</FormControl>
					<PasswordInput
						isInvalid={passwordError}
						name='password'
						value={password}
						onChange={handleChange}
						placeholder='********'
					/>
				</Stack>

				<Stack>
					<Button
						onClick={handleLogin}
						colorScheme={loginError ? 'red' : 'green'}
						isLoading={isAuthenticating}
					>
						Sign in
					</Button>
					<Text textAlign={'center'} cursor={'pointer'} onClick={forgotPassword}>
						forgot password?
					</Text>
				</Stack>
				<Center>
					<ReCAPTCHA ref={recaptchaRef} size='invisible' sitekey={CAPTCHA_KEY} badge='inline' />
				</Center>
			</Stack>
		</>
	);
}
