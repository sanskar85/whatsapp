import { useBoolean, useToast } from '@chakra-ui/react';
import { useState } from 'react';

export default function useUserData() {
	const [hasError, setError] = useState(false);
	const [dataLoaded, setDataLoaded] = useBoolean(false);
	const toast = useToast();

	return {
		loading: !dataLoaded,
		error: hasError,
	};
}

function addDelay(delay: number) {
	return new Promise((resolve: (value?: null) => void) => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}
