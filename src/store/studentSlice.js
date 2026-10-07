import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchStudents = createAsyncThunk('students/fetchAll', async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/students?${query}`);
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
});

export const promoteCohort = createAsyncThunk('students/promote', async (batchId) => {
  const res = await fetch('/api/students/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchId }),
  });
  if (!res.ok) throw new Error('Failed to promote cohort');
  return res.json();
});

const studentSlice = createSlice({
  name: 'students',
  initialState: { items: [], total: 0, page: 1, totalPages: 1, loading: false, error: null, promoteResult: null },
  reducers: {
    clearPromoteResult: (state) => { state.promoteResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.students;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchStudents.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(promoteCohort.fulfilled, (state, action) => { state.promoteResult = action.payload; });
  },
});

export const { clearPromoteResult } = studentSlice.actions;
export default studentSlice.reducer;
