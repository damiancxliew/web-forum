import { NavLink } from "react-router-dom";

// A simple NotFound component
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-4xl font-bold">404</h1>
    <p className="text-lg mt-2">Page Not Found</p>
    <NavLink to="/" className="mt-4 text-blue-500 underline">
      Go back to Home
    </NavLink>
  </div>
);

export default NotFound;
