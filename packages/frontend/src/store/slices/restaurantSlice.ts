import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { restaurantService } from '../../services/restaurantService';
import { Restaurant, TableAvailability, SearchCriteria } from '@restaurant-reservation/shared';

interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  availableTables: TableAvailability[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RestaurantState = {
  restaurants: [],
  selectedRestaurant: null,
  availableTables: [],
  isLoading: false,
  error: null,
};

export const fetchRestaurants = createAsyncThunk(
  'restaurant/fetchRestaurants',
  async (filters?: { city?: string; state?: string }, { rejectWithValue }) => {
    try {
      const response = await restaurantService.getRestaurants(filters);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to fetch restaurants');
    }
  }
);

export const searchAvailability = createAsyncThunk(
  'restaurant/searchAvailability',
  async (criteria: SearchCriteria & { restaurantId: string }, { rejectWithValue }) => {
    try {
      const { restaurantId, ...searchParams } = criteria;
      const response = await restaurantService.searchAvailability(restaurantId, searchParams);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to search availability');
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
    clearAvailableTables: (state) => {
      state.availableTables = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.restaurants = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableTables = action.payload;
      })
      .addCase(searchAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedRestaurant, clearAvailableTables } = restaurantSlice.actions;
export default restaurantSlice.reducer;

