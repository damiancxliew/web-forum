import {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  useReducer,
  useEffect,
  useState,
} from "react";

export interface AdminRequest {
  _id: string;
  name: string;
  role: string;
  mobileNumber: string;
  organisation: string;
  status: "pending" | "accepted" | "rejected";
  user: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  address?: string;
  profilePicture?: string;
  adminRequests: AdminRequest[];
  password: string;
}

interface AuthContextType {
  user: User | null;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  error: string | null;
  login: (userData: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

interface Action {
  type: "LOGIN" | "LOGOUT" | "UPDATE_USER" | "SET_ERROR";
  payload: User | null | string;
}

interface State {
  user: User | null;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const authReducer = (state: State, action: Action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload as User, error: null };
    case "LOGOUT":
      return { user: null, error: null };
    case "UPDATE_USER":
      return { ...state, user: action.payload as User };
    case "SET_ERROR":
      return { ...state, error: action.payload as string };
    default:
      return state;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: JSON.parse(localStorage.getItem("user") || "null"),
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync with localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem("user", JSON.stringify(state.user));
    } else {
      localStorage.removeItem("user");
    }
  }, [state.user]);

  // Simulate API call or auth check
  useEffect(() => {
    const simulateAuthCheck = async () => {
      try {
        setIsLoading(true);
        // Simulate a delay (e.g., fetching user from API)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          dispatch({ type: "LOGIN", payload: JSON.parse(storedUser) });
        }
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load user data" });
      } finally {
        setIsLoading(false);
      }
    };

    simulateAuthCheck();
  }, []);

  const login = (userData: User) => {
    dispatch({ type: "LOGIN", payload: userData });
  };

  const logout = () => {
    dispatch({ type: "LOGOUT", payload: null });
  };

  const isAdmin = () => {
    return state.user?.isAdmin || false;
  };

  const isSuperAdmin = () => {
    return state.user?.isSuperAdmin || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        dispatch,
        isLoading,
        error: state.error,
        login,
        logout,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {isLoading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
