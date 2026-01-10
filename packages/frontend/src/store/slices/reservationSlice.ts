import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '../../services/reservationService';
import { getErrorMessage } from '../../utils/apiError';
import { Reservation, CreateReservationDto } from '@restaurant-reservation/shared';

export interface ReservationState {
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
      return rejectWithValue(getErrorMessage(error));
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
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateReservation = createAsyncThunk(
  'reservation/updateReservation',
  async (
    { id, data }: { id: string; data: Partial<CreateReservationDto> & { version?: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await reservationService.updateReservation(id, data);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelReservation = createAsyncThunk(
  'reservation/cancelReservation',
  async (id: string, { rejectWithValue }) => {
    try {
      await reservationService.cancelReservation(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const removeTableFromReservation = createAsyncThunk(
  'reservation/removeTableFromReservation',
  async ({ reservationId, tableId }: { reservationId: string; tableId: string }, { rejectWithValue }) => {
    try {
      const response = await reservationService.removeTableFromReservation(reservationId, tableId);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
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
      })
      .addCase(updateReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.reservations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
        if (state.currentReservation?.id === action.payload.id) {
          state.currentReservation = action.payload;
        }
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = state.reservations.filter((r) => r.id !== action.payload);
        if (state.currentReservation?.id === action.payload) {
          state.currentReservation = null;
        }
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentReservation, clearCurrentReservation } = reservationSlice.actions;
export default reservationSlice.reducer;

