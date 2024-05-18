import './App.css';

import { Flex } from '@chakra-ui/react';
import Welcome from './views/pages/welcome';

function App() {
	return (
		<Flex minHeight={'100vh'} width={'100vw'} className='bg-background dark:bg-background-dark'>
			<Welcome />
		</Flex>
	);
}

export default App;
