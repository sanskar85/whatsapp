import { Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Colors, NAVIGATION } from '../../../../config/const';
import { useAuth } from '../../../../hooks/useAuth';
import AuthService from '../../../../services/auth.service';
import { PasswordInput } from './PasswordInput';

export default function LoginTab() {
	const navigate = useNavigate();
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

	const handleLogin = async () => {
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

				<Stack spacing='6'>
					<Button
						onClick={handleLogin}
						colorScheme={loginError ? 'red' : 'green'}
						isLoading={isAuthenticating}
					>
						Sign in
					</Button>
				</Stack>
			</Stack>
		</>
	);
}
