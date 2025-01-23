import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { apiRequest } from "../api/apiRequest";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import DeleteAccount from "./DeleteAccount";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  profilePicture: string;
}

function EditProfile() {
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const firstName = user?.username?.split(" ")[0] || "";
  const lastName = user?.username?.split(" ").slice(1).join(" ") || "";
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string>(
    user?.profilePicture || ""
  );
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: firstName || "",
    lastName: lastName || "",
    email: user?.email || "",
    address: user?.address || "",
    profilePicture: user?.profilePicture || "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await apiRequest("users", "GET", `${user?.id}`);
      if (response.success) {
        dispatch({ type: "LOGIN", payload: response.data });
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const releaseProfilePicture = async () => {
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    };
    releaseProfilePicture();
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      const base64Image = await compressImage(file);
      console.log(base64Image);
      setFormData((prev) => ({
        ...prev,
        profilePicture: base64Image as string,
      }));
    }
  };

  const handleDeleteProfilePicture = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
    setPreviewUrl("");
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // For Reference: Adjust quality here (0.6 = 60% quality)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          resolve(compressedBase64);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const isEmailChange = formData.email !== user?.email;
    const formattedFormData = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      address: formData.address,
      profilePicture: formData.profilePicture,
    };
    try {
      const response = await apiRequest(
        "users",
        "POST",
        `update/${user?.id}`,
        formattedFormData
      );

      if (response.success) {
        console.log(response.data);
        const verificationToken = response.data?.data?.verificationToken;
        console.log("Token:", verificationToken);

        if (isEmailChange && verificationToken) {
          // Create verification URL
          const verificationUrl = `${process.env.REACT_APP_API_URL}/verify/email/${verificationToken}`;

          // Send verification email
          const emailResponse = await apiRequest("email", "POST", "send", {
            to: formData.email,
            subject: "Email Verification Required",
            text: `Please verify your new email address by clicking this link: ${verificationUrl}`,
            html: `
                            <h1>Email Verification Required</h1>
                            <p>Please click the button below to verify your new email address:</p>
                            <a href="${verificationUrl}" 
                               style="background-color: #4CAF50; 
                                      color: white; 
                                      padding: 14px 20px; 
                                      text-decoration: none; 
                                      border-radius: 4px;
                                      display: inline-block;">
                                Verify Email
                            </a>
                            <p>Or copy and paste this link in your browser:</p>
                            <p>${verificationUrl}</p>
                            <p>This link will expire in 24 hours.</p>
                        `,
          });

          if (emailResponse.success) {
            setModalState({
              isOpen: true,
              title: "Success",
              message: `Please verify your new email address at ${formData.email}`,
            });
          } else {
            setModalState({
              isOpen: true,
              title: "Error",
              message: "Please try again.",
            });
          }
        } else {
          setModalState({
            isOpen: true,
            title: "Success",
            message: "Profile updated successfully!",
          });
        }
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

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.title === "Success") {
      navigate("/profile");
    }
  };

  return (
    <div className="max-w-4xl mx-3 mt-8">
      {/* Header Banner */}
      <div className="bg-blue-600 p-8 text-white rounded-t-lg">
        <h1 className="text-3xl font-bold">Hi, {user?.username}</h1>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-b-lg shadow-md relative">
        {/* Delete Account Button */}
        <DeleteAccount />

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex gap-12">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Upload Button */}
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800 bg-gray-100 px-4 py-2 rounded-md"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload new photo
              </button>

              {/* Delete Button */}
              <button
                onClick={handleDeleteProfilePicture}
                className="text-red-500 hover:text-red-600"
              >
                Delete Picture
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-6">Full Name</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-semibold">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-full bg-white"
                    placeholder="type here.."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-semibold">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
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
                <div className="space-y-2">
                  <label className="block font-semibold">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
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
