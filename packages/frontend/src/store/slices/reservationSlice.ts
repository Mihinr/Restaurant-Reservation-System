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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number;
            data?: { error?: string; message?: string };
            statusText?: string;
          } 
        };
        
        // Handle rate limiting specifically
        if (axiosError.response?.status === 429) {
          return rejectWithValue(
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            'Too many requests. Please wait a moment and try again.'
          );
        }
        
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.response?.statusText ||
          'Failed to fetch reservations';
        return rejectWithValue(errorMessage);
      }
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Failed to create reservation';
        return rejectWithValue(errorMessage);
      }
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to create reservation');
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Failed to update reservation';
        return rejectWithValue(errorMessage);
      }
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update reservation');
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Failed to cancel reservation';
        return rejectWithValue(errorMessage);
      }
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to cancel reservation');
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

