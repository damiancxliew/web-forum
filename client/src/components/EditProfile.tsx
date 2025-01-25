import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { apiRequest } from "../api/apiRequest";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import DeleteAccount from "./DeleteAccount";

interface ProfileFormData {
  username: string;
  // lastName: string;
  email: string;
  // address: string;
  // profilePicture: string;
}

function EditProfile() {
  var { user, dispatch } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const username = user?.username;
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string>(
    user?.profilePicture || ""
  );
  const [formData, setFormData] = useState<ProfileFormData>({
    username: username || "",
    // lastName: lastName || "",
    email: user?.email || "",
    // address: user?.address || "",
    // profilePicture: user?.profilePicture || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const isEmailChange = formData.email !== user?.email;
    const formattedFormData = {
      username: formData.username,
      email: formData.email,
    };
    try {
      const response = await apiRequest("users", "PUT", `${user?.id}`, {
        ...formattedFormData,
        password: user?.password,
      });

      if (response.success) {
        dispatch({ type: "UPDATE_USER", payload: response.data });
        const verificationToken = response.data?.verificationToken;
        console.log("Token:", verificationToken);

        setModalState({
          isOpen: true,
          title: "Success",
          message: "Profile updated successfully!",
        });
      } else {
        setModalState({
          isOpen: true,
          title: "Error",
          message: response.message || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalState({
        isOpen: true,
        title: "Failed to update profile",
        message: "An error occurred while updating your profile",
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await apiRequest("get_user", "GET", `${user?.id}`);
      if (response.success) {
        dispatch({ type: "LOGIN", payload: response.data });
      }
    };
    fetchUserData();
  }, [handleSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.title === "Success") {
      navigate("/profile");
    }
  };

  return (
    <div className="max-w-4xl mx-80 mt-8">
      {/* Header Banner */}
      <div className="bg-blue-600 p-8 text-white rounded-t-lg">
        <h1 className="text-3xl font-bold">Hi, {user?.username}</h1>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-b-lg shadow-md relative">
        {/* Delete Account Button */}
        <DeleteAccount />

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex">
            {/* Form Fields */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-6">Full Name</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-semibold">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-full bg-white"
                    placeholder="type here.."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-full bg-white"
                    placeholder="type here.."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-500 text-white px-8 py-2 rounded-full hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </form>

        <ProfileModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          title={modalState.title}
        >
          <p>{modalState.message}</p>
        </ProfileModal>
      </div>
    </div>
  );
}

export default EditProfile;
