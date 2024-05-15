import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NAVIGATION } from '../../../config/const';
import { saveClientID } from '../../../utils/ChromeUtils';

export default function Open() {
	const { id } = useParams();
	const navigate = useNavigate();

	useEffect(() => {
		if (id) {
			saveClientID(id);
		}
		navigate(NAVIGATION.WELCOME);
	}, [id, navigate]);

	return <></>;
}
