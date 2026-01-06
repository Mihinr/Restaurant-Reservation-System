import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '../../services/reservationService';
import { Reservation, CreateReservationDto } from '@restaurant-reservation/shared';

interface ReservationState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReservationState = {
  reservations: [],
  currentReservation: null,
  isLoading: false,
  error: null,
};

export const fetchReservations = createAsyncThunk(
  'reservation/fetchReservations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reservationService.getReservations();
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch reservations');
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservation/createReservation',
  async (data: CreateReservationDto, { rejectWithValue }) => {
    try {
      const response = await reservationService.createReservation(data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create reservation');
    }
  }
);

const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    setCurrentReservation: (state, action) => {
      state.currentReservation = action.payload;
    },
    clearCurrentReservation: (state) => {
      state.currentReservation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations.push(action.payload);
        state.currentReservation = action.payload;
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentReservation, clearCurrentReservation } = reservationSlice.actions;
export default reservationSlice.reducer;

