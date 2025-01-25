import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  var { user } = useAuth(); // Get the user from AuthProvider
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;
