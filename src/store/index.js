import { configureStore } from '@reduxjs/toolkit';
import batchSlice from './batchSlice';
import studentSlice from './studentSlice';
import dashboardSlice from './dashboardSlice';
import reportSlice from './reportSlice';

export const store = configureStore({
  reducer: {
    batches: batchSlice,
    students: studentSlice,
    dashboard: dashboardSlice,
    report: reportSlice,
  },
});

export default store;
