import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchReport = createAsyncThunk('report/fetch', async () => {
  const res = await fetch('/api/report');
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
});

export const fetchAuditStudents = createAsyncThunk('report/audit', async ({ metric, batchId }) => {
  const res = await fetch(`/api/audit/students?metric=${metric}&batch=${batchId}`);
  if (!res.ok) throw new Error('Failed to fetch audit data');
  return res.json();
});

const reportSlice = createSlice({
  name: 'report',
  initialState: { data: null, loading: false, error: null, auditStudents: [], auditLoading: false, auditMetric: null },
  reducers: {
    clearAudit: (state) => { state.auditStudents = []; state.auditMetric = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReport.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReport.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchReport.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchAuditStudents.pending, (state) => { state.auditLoading = true; })
      .addCase(fetchAuditStudents.fulfilled, (state, action) => {
        state.auditLoading = false;
        state.auditStudents = action.payload.students;
        state.auditMetric = action.payload.metric;
      })
      .addCase(fetchAuditStudents.rejected, (state) => { state.auditLoading = false; });
  },
});

export const { clearAudit } = reportSlice.actions;
export default reportSlice.reducer;
