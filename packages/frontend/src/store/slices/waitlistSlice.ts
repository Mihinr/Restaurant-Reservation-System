import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { waitlistService } from '../../services/waitlistService';
import { WaitlistEntry, CreateWaitlistEntryDto } from '@restaurant-reservation/shared';

interface WaitlistState {
  entries: WaitlistEntry[];
  currentEntry: WaitlistEntry | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WaitlistState = {
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,
};

export const joinWaitlist = createAsyncThunk(
  'waitlist/joinWaitlist',
  async (data: CreateWaitlistEntryDto, { rejectWithValue }) => {
    try {
      const response = await waitlistService.joinWaitlist(data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Failed to join waitlist';
        return rejectWithValue(errorMessage);
      }
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to join waitlist');
    }
  }
);

export const fetchWaitlistByRestaurant = createAsyncThunk(
  'waitlist/fetchWaitlistByRestaurant',
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const response = await waitlistService.getWaitlistByRestaurant(restaurantId);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch waitlist');
    }
  }
);

export const updateWaitlistStatus = createAsyncThunk(
  'waitlist/updateWaitlistStatus',
  async (
    { id, status }: { id: string; status: WaitlistEntry['status'] },
    { rejectWithValue }
  ) => {
    try {
      const response = await waitlistService.updateWaitlistStatus(id, status);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        const errorMessage =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Failed to update waitlist status';
        return rejectWithValue(errorMessage);
      }
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to update waitlist status');
    }
  }
);

export const removeFromWaitlist = createAsyncThunk(
  'waitlist/removeFromWaitlist',
  async (id: string, { rejectWithValue }) => {
    try {
      await waitlistService.removeFromWaitlist(id);
      return id;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to remove from waitlist');
    }
  }
);

const waitlistSlice = createSlice({
  name: 'waitlist',
  initialState,
  reducers: {
    clearWaitlist: (state) => {
      state.entries = [];
      state.currentEntry = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinWaitlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinWaitlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEntry = action.payload;
        state.entries.push(action.payload);
      })
      .addCase(joinWaitlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWaitlistByRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWaitlistByRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
      })
      .addCase(fetchWaitlistByRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWaitlistStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWaitlistStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
      })
      .addCase(updateWaitlistStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeFromWaitlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWaitlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = state.entries.filter((entry) => entry.id !== action.payload);
      })
      .addCase(removeFromWaitlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWaitlist } = waitlistSlice.actions;
export default waitlistSlice.reducer;

