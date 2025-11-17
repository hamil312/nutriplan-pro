const { createSlice, createAsyncThunk } = window.RTK;
import apiServiceSingleton from "../services/apiService.js";

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue, meta }) => {
        try {
            const api = apiServiceSingleton.getInstance();

            // Reqres login → returns only { token }
            const resp = await api.post("/login", { email, password });

            return resp; // contains token only
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        token: null,
        status: "idle",
        error: null
    },

    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.status = "idle";
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.status = "loading";
            })

            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.token = action.payload.token || null;

                // Reqres does NOT return user info → we store the email used in the login request
                state.user = { email: action.meta.arg.email };
            })

            .addCase(loginUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || action.error.message;
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;