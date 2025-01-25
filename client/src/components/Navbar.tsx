import { useState } from "react";
import { CircleUserRound, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const profilePicture = user?.profilePicture;

  const handleLogOut = () => {
    setTimeout(() => {
      dispatch({
        type: "LOGOUT",
        payload: null,
      });
      navigate("/");
    }, 1000); // REDIRECT after logout
  };

  return (
    <div className="shadow-md w-full p-4">
      <nav className="flex justify-between items-center pl-24">
        {/* Center - Navigation Links */}
        <div className="flex-1 flex justify-center items-center gap-8">
          <NavLink className="text-lg font-medium" to="/home">
            Home
          </NavLink>
          <NavLink
            className="text-lg font-medium flex flex-row items-center gap-2"
            to="/profile"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <CircleUserRound />
            )}
            <p>{user?.username}</p>
          </NavLink>
        </div>

        {/* Right Side - Logout Button */}
        <button
          onClick={handleLogOut}
          className="flex items-center gap-2 text-red-500 px-4 py-2 rounded-md border border-transparent hover:border-red-600"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>
    </div>
  );
}
