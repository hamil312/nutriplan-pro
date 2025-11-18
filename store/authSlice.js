//This slice manages user authentication state, including login actions and storing user info and tokens
const { createSlice, createAsyncThunk } = window.RTK;
import apiServiceSingleton from "../services/apiService.js";

//Async thunk action for logging in a user, this comes from the Redux Toolkit
export const loginUser = createAsyncThunk(
    //This is the action type string
    "auth/loginUser",
    //This is the payload creator function that performs the async login operation
    async ({ email, password }, { rejectWithValue, meta }) => {
        try {
            //Get the singleton instance of the API service
            const api = apiServiceSingleton.getInstance();

            //The Reqres API uses a POST request to the /login endpoint with email and password, this returns a token on success
            const resp = await api.post("/login", { email, password });

            //Contains the response from the API
            return resp;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

//Create the auth slice using Redux Toolkit's createSlice
const authSlice = createSlice({
    //Slices have names, initial state, reducers, and extra reducers for handling async actions
    name: "auth",
    //Define the initial state for authentication
    initialState: {
        user: null,
        token: null,
        status: "idle",
        error: null
    },

    reducers: {
        //Reducer to handle user logout
        logout(state) {
            state.user = null;
            state.token = null;
            state.status = "idle";
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        //Handle the different states of the loginUser async thunk
        builder
            .addCase(loginUser.pending, (state) => {
                //When the login is pending, set the status to loading
                state.status = "loading";
            })

            .addCase(loginUser.fulfilled, (state, action) => {
                //When the login is successful, update the state with user info and token
                state.status = "succeeded";
                state.token = action.payload.token || null;

                //Reqres does not return user info, we store the email from the login attempt
                state.user = { email: action.meta.arg.email };
            })

            .addCase(loginUser.rejected, (state, action) => {
                //When the login fails, set the status to failed and store the error message
                state.status = "failed";
                state.error = action.payload || action.error.message;
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;