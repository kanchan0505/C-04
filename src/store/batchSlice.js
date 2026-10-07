import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBatches = createAsyncThunk('batches/fetchAll', async () => {
  const res = await fetch('/api/batches');
  if (!res.ok) throw new Error('Failed to fetch batches');
  return res.json();
});

const batchSlice = createSlice({
  name: 'batches',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatches.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBatches.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchBatches.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export default batchSlice.reducer;
