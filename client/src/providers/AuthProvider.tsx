import { createContext, useContext, ReactNode, Dispatch, useReducer, useEffect, useState } from 'react';

export interface AdminRequest {
    _id: string;
    name: string;
    role: string;
    mobileNumber: string;
    organisation: string;
    status: 'pending' | 'accepted' | 'rejected';
    user: string;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    address?: string;
    profilePicture?: string;
    adminRequests: AdminRequest[];
}

interface AuthContextType {
  user: User | null;
  dispatch: Dispatch<Action>;
}

interface Action {
    type: "LOGIN" | "LOGOUT" | "UPDATE_USER"
    payload: User | null;
}

interface State {
    user: User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const authReducer = (state: State, action: Action) => {
    switch (action.type) {
        case "LOGIN":
            return { user: action.payload };
        case "LOGOUT":
            return { user: null };
        case "UPDATE_USER":
            return { user: action.payload };
        default:
            return state;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialize state from localStorage
    const [state, dispatch] = useReducer(authReducer, {
        user: JSON.parse(localStorage.getItem('user') || 'null') 
    });
    //reminder to remove from local storage when logging out

    useEffect(() => {
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
        } else {
            localStorage.removeItem('user');
        }
    }, [state.user]);
  
    return (
        <AuthContext.Provider value={{ user: state.user, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}