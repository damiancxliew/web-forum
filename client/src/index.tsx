import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Landing from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import "./index.css";
import EditProfile from "./components/EditProfile";
import { ChakraProvider } from "@chakra-ui/react";
import AdminRequest from "./components/AdminRequest";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/", // Landing page route
        element: <Landing />,
      },
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/login", // Login page route
        element: <Login />,
      },
      {
        path: "/signup", // Login page route
        element: <Signup />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/profile/edit",
        element: <EditProfile />,
      },
      {
        path: "/profile/adminRequest",
        element: <AdminRequest />,
      },
    ],
  },
  {
    path: "/admin",
    element: <App />,
    children: [
      {
        path: "/admin",
        element: <Admin />,
      },
    ],
  },
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
