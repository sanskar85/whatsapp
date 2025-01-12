import { configureStore } from '@reduxjs/toolkit';

import { StoreNames } from './config';
import { default as AdminReducers } from './reducers/AdminReducers';
import { default as DevicesReducer } from './reducers/DeviceReducer';
import { default as PaymentReducers } from './reducers/PaymentReducers';
import { default as UsersReducer } from './reducers/UsersReducer';

const store = configureStore({
	reducer: {
		[StoreNames.USERS]: UsersReducer,
		[StoreNames.PAYMENTS]: PaymentReducers,
		[StoreNames.ADMIN]: AdminReducers,
		[StoreNames.DEVICES]: DevicesReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export default store;

export type StoreState = ReturnType<typeof store.getState>;
