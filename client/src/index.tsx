import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, NavLink, RouterProvider } from "react-router-dom";
import App from "./App";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import "./index.css";
import EditProfile from "./components/EditProfile";
import { ChakraProvider } from "@chakra-ui/react";
import AdminRequest from "./components/AdminRequest";
import LandingPage from "./components/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/", // Landing page route
        element: <LandingPage />,
      },
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/login", // Login page route
        element: <Login />,
      },
      {
        path: "/signup", // Signup page route
        element: <Signup />,
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/edit",
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: <App />,
    children: [
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: "*", element: <NotFound />, handle: { isNotFound: true } },
  //Example on creating new path
  // {
  //     path: "/{new_path}",
  //     element: <App />,
  //     children: [
  //         {
  //             path: "/{new_path}",
  //             element: {file_name},
  //         },
  //     ],
  // },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
);
