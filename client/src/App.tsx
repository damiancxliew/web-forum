import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./providers/AuthProvider";

const App = () => {
  const location = useLocation();

  // List of routes where the navbar should not appear
  const hideNavbarRoutes = ["/login", "/signup", "/"];

  const shouldShowNavbar =
    !hideNavbarRoutes.includes(location.pathname) &&
    location.state?.isNotFound !== true; // Add state check for not found pages

  return (
    <AuthProvider>
      <div className="w-full pt-4">
        {shouldShowNavbar && <Navbar />}
        <Outlet />
      </div>
    </AuthProvider>
  );
};

export default App;
