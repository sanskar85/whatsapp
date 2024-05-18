import { Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react';
import { useState } from 'react';
import { Colors } from '../../../../config/const';
import { useAuth } from '../../../../hooks/useAuth';

export default function LoginTab({ onSignIn }: { onSignIn: (text: string) => void }) {
	const { isAuthenticating } = useAuth();
	const [{ username }, setCredentials] = useState({
		username: '',
	});

	const [{ usernameError }, setUIDetails] = useState({
		usernameError: false,
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
		if (!username) {
			return setUIDetails({
				usernameError: true,
			});
		}
		onSignIn(username);
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
				</Stack>

				<Stack>
					<Button onClick={handleLogin} colorScheme={'green'} isLoading={isAuthenticating}>
						Sign in
					</Button>
				</Stack>
			</Stack>
		</>
	);
}
