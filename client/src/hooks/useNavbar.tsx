import { ComponentWithAs, IconProps } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { singletonHook } from 'react-singleton-hook';
import { NAVIGATION } from '../config/const';

export type NavbarLocation = {
	title: string;
	icon?: string | ComponentWithAs<'svg', IconProps> | IconType;
	link?: string;
	actions?: React.ReactNode;
};

const initStatus: { locations: NavbarLocation[]; searchText: string } = {
	locations: [],
	searchText: '',
};
let globalSet: React.Dispatch<
	React.SetStateAction<{
		locations: NavbarLocation[];
		searchText: string;
	}>
> = () => {
	throw new Error('you must useNavbar before setting its state');
};

export const useNavbar = singletonHook(initStatus, () => {
	const [navDetails, setNavDetails] = useState(initStatus);
	globalSet = setNavDetails;

	useEffect(() => {
		setNavDetails({
			searchText: '',
			locations: [
				{
					title: 'Whatsleads',
					link: NAVIGATION.HOME,
				},
			],
		});
	}, []);

	return { locations: navDetails.locations, searchText: navDetails.searchText };
});

export const pushToNavbar = (data: NavbarLocation) => {
	globalSet((prev) => ({
		...prev,
		searchText: '',
		locations: [...prev.locations, data],
	}));
};

export const popFromNavbar = () => {
	globalSet((prev) => ({
		...prev,
		searchText: '',
		locations: prev.locations.slice(0, -1),
	}));
};

export const setNavbarSearchText = (searchText: string) => {
	globalSet((prev) => ({
		...prev,
		searchText: searchText,
	}));
};
