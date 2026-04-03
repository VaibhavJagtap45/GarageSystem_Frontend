import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getToken, getUser, getGarage, clearStorage } from "../../utils/storage";

// ─── Session Restore Thunk ─────────────────────────────────────────────────────
// Reads persisted data from AsyncStorage on app boot and hydrates Redux state.
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      const user = await getUser();
      const garage = await getGarage();
      if (token && user) {
        return { token, user, garage };
      }
      return null;
    } catch {
      return rejectWithValue(null);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,         // { _id, phoneNo, role, fullName, ... }
    garage: null,       // { garageName, garageOwnerName, ... }
    accessToken: null,
    loading: true,      // true until session restore completes
    isAuthenticated: false,
  },
  reducers: {
    // Dispatched after successful OTP verification
    loginSuccess(state, action) {
      const { user, garage, accessToken } = action.payload;
      state.user = user;
      state.garage = garage ?? null;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.loading = false;
    },
    // Dispatched after GarageDetails form is saved successfully
    updateGarage(state, action) {
      state.garage = { ...state.garage, ...action.payload };
    },
    // Dispatched after user profile fields (email, fullName) are updated
    setUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    // Dispatched on logout
    logout(state) {
      state.user = null;
      state.garage = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // While restoring session, keep loading = true
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      // Session found in storage
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.garage = action.payload.garage ?? null;
          state.accessToken = action.payload.token;
          state.isAuthenticated = true;
        }
        state.loading = false;
      })
      // No session or error
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { loginSuccess, updateGarage, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
