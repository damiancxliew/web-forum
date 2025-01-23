import React, { useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { Link } from "react-router-dom";
import { UserPen } from "lucide-react";
import { apiRequest } from "../api/apiRequest";
import { Tooltip } from "react-tooltip";

function Profile() {
  const { user, dispatch } = useAuth();
  const name = user?.username;
  const email = user?.email;
  const address = user?.address;
  const profilePicture = user?.profilePicture;

  useEffect(() => {
    console.log("Test here", user);
    const fetchUserData = async () => {
      const response = await apiRequest("get_user", "GET", `${user?.id}`);
      if (response.success) {
        dispatch({ type: "LOGIN", payload: response.data });
      } else {
        console.error("WRONG");
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="max-w-4xl mt-8 mx-3">
      {/* Header Banner */}
      <div className="bg-blue-600 p-8 text-white rounded-t-lg">
        <h1 className="text-3xl font-bold">Hi, {name}</h1>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-b-lg shadow-md">
        <div className="flex justify-between items-start mb-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <svg
                  className="w-24 h-24 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 10-16 0" />
                </svg>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex-1 ml-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Full Name</h2>
              <Link
                className="flex flex-row items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
                to="/profile/edit"
              >
                <UserPen />
                <button>Edit Profile</button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-semibold">First Name</label>
                <input
                  type="text"
                  value={name?.split(" ")[0] || ""}
                  readOnly
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="type here.."
                />
              </div>
              <div className="space-y-2">
                <label className="block font-semibold">Last Name</label>
                <input
                  type="text"
                  value={name?.split(" ")[1] || ""}
                  readOnly
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="type here.."
                />
              </div>
              <div className="space-y-2">
                <label className="block font-semibold">Email</label>
                <input
                  type="email"
                  value={email || ""}
                  readOnly
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="type here.."
                />
              </div>
              <div className="space-y-2">
                <label className="block font-semibold">Address</label>
                <input
                  type="text"
                  readOnly
                  className="w-full p-3 border rounded-lg bg-gray-50"
                  placeholder="type here.."
                  value={address || ""}
                />
              </div>
              {/* Request for Admin Button */}
              <div className="col-span-2 flex justify-end">
                {" "}
                {/* Use col-span-2 to span across both columns */}
                <Link
                  className="bg-gray-300 text-black px-6 py-2 rounded-full hover:bg-gray-400"
                  to="/profile/adminRequest"
                >
                  <button
                    className="flex justify-center items-center"
                    data-tooltip-id="request"
                    data-tooltip-content="Click to request for admin access"
                  >
                    Request for Admin
                  </button>
                  <Tooltip id="request" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
