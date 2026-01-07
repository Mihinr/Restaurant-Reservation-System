import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reservationReducer from './slices/reservationSlice';
import restaurantReducer from './slices/restaurantSlice';
import waitlistReducer from './slices/waitlistSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reservation: reservationReducer,
    restaurant: restaurantReducer,
    waitlist: waitlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

