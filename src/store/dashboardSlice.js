import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export default dashboardSlice.reducer;
