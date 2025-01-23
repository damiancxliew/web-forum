import { useState } from "react";
import { CircleUserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const {user} = useAuth();
  const profilePicture = user?.profilePicture;
  return (
    <div className="shadow-md w-full p-1">
      <nav className="flex justify-center items-center mb-6">
        <div>
          <NavLink to="/home">ELEOS Logo</NavLink>
        </div>
        <div
          className={`md:flex md:items-center md:pb-0 pb-12 absolute md:static bg-white md:z-auto z-[-1] left-0 w-full md:w-auto md:pl-0 pl-9 transition-all duration-300 ease-in"
                    } md:opacity-100`}
        >
          <NavLink className="md:ml-8 text-lg md:my-0 my-7" to="/home">
            Home
          </NavLink>

          <NavLink className="md:ml-8 text-lg md:my-0 my-7" to="/admin">
            Admin
          </NavLink>
          <NavLink className="md:ml-8 text-lg md:my-0 my-7 flex flex-row items-center gap-2" to="/profile">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-8 h-8 rounded-full" />
            ) : (
              <CircleUserRound />
            )}
            <p>{user?.username}</p>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
