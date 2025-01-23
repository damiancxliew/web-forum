import {
  AdminRequest as AdminRequestData,
  useAuth,
} from "../providers/AuthProvider";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/apiRequest";
import ProfileModal from "./ProfileModal";
import { Link } from "react-router-dom";

interface AdminRequestFormData {
  name: string;
  role: string;
  mobileNumber: string;
  organisation: string;
}

const stringRegex = /^[a-zA-Z0-9 ]{1,255}$/;
const mobileRegex = /^\d{8,15}$/;

const AdminRequest = () => {
  const { user, dispatch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [formData, setFormData] = useState<AdminRequestFormData>({
    name: "",
    role: "",
    mobileNumber: "",
    organisation: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stringRegex.test(formData.name)) {
      setModalState({
        isOpen: true,
        title: "Validation Failed",
        message:
          "Name must be up to 255 characters and only contain alphanumeric characters and spaces.",
      });
      return;
    }

    if (!stringRegex.test(formData.role)) {
      setModalState({
        isOpen: true,
        title: "Validation Failed",
        message:
          "Role must be up to 255 characters and only contain alphanumeric characters and spaces.",
      });
      return;
    }

    if (!mobileRegex.test(formData.mobileNumber)) {
      setModalState({
        isOpen: true,
        title: "Validation Failed",
        message:
          "Mobile Number must be between 8-15 digits and contain only numeric characters.",
      });
      return;
    }

    if (!stringRegex.test(formData.organisation)) {
      setModalState({
        isOpen: true,
        title: "Validation Failed",
        message:
          "Organisation must be up to 255 characters and only contain alphanumeric characters and spaces.",
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await apiRequest(
        "adminRequest",
        "POST",
        `${user?.id}`,
        formData
      );

      setIsLoading(false);
      if (response.success) {
        if (user?.id) {
          dispatch({
            type: "UPDATE_USER", // Assuming "LOGIN" is the action that updates the user
            payload: {
              ...user,
              adminRequests: [...user.adminRequests, response.data.data], // Add the new request to the existing array
            },
          });
        }
        setFormData({
          name: "",
          role: "",
          mobileNumber: "",
          organisation: "",
        });
        setModalState({
          isOpen: true,
          title: "Success",
          message: "Profile updated successfully!",
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error sending admin request:", error);
      setModalState({
        isOpen: true,
        title: "Failed to send admin request",
        message: "An error occurred while sending admin request",
      });
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div>
      <div className="bg-blue-800">
        {/* Request for Admin Header */}
        <div className="flex justify-between rounded-lg">
          <h1 className="text-3xl text-white font-bold p-6">
            Request for Admin
          </h1>
          <p className="bg-gray-300 rounded-lg font-semibold m-6 px-8 py-2 flex items-center justify-center">
            {" "}
            {user?.username}
          </p>
        </div>

        {/* Contact information section */}
        <form onSubmit={handleSubmit} className="flex flex-wrap">
          <div className="mb-6 bg-white mx-10 w-full rounded-lg">
            <div>
              <h2 className="bg-blue-200 text-xl font-semibold mb-4 p-2 rounded-lg">
                Your contact information:
              </h2>
            </div>

            {/* Name */}
            <div className="mb-4 flex items-center border-b-2 border-gray-500 pb-4">
              <label className="font-medium mx-4">Name:</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg bg-gray-50 h-1/2"
                placeholder="type here..."
                required
              />
            </div>

            {/* Role */}
            <div className="mb-4 flex items-center border-b-2 border-gray-500 pb-4">
              <label className="font-medium mx-4">Role:</label>
              <input
                name="role"
                type="text"
                value={formData.role}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg bg-gray-50 h-1/2"
                placeholder="type here..."
                required
              />
            </div>

            {/* Mobile Number */}
            <div className="mb-4 flex items-center border-b-2 border-gray-500 pb-4">
              <label className="font-medium mx-4">Mobile Number:</label>
              <input
                name="mobileNumber"
                type="text"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg bg-gray-50 h-1/2"
                placeholder="type here..."
                required
              />
            </div>

            {/* Organisation */}
            <div className="mb-4 flex items-center border-b-2 border-gray-500 pb-4">
              <label className="font-medium mx-4">Organisation:</label>
              <input
                name="organisation"
                type="text"
                value={formData.organisation}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg bg-gray-50 h-1/2"
                placeholder="type here..."
                required
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-300 text-black font-semibold mb-6 mr-6 px-8 py-2 rounded hover:bg-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>

            {/* Past activities */}
            <div>
              <div className="bg-blue-200 font-semibold p-2 rounded">
                <p className="text-xl"> Your past activity:</p>
              </div>
              <div className="bg-white rounded-lg">
                <ul className="px-4">
                  {user?.adminRequests && user?.adminRequests?.length > 0 ? (
                    user.adminRequests.map((request) => (
                      <li key={request._id} className="border-b-2 py-2">
                        <div>Name: {request.name}</div>
                        <div>Role: {request.role}</div>
                        <div>Organisation: {request.organisation}</div>
                        <div>Status: {request.status}</div>
                      </li>
                    ))
                  ) : (
                    <p className="py-4 flex justify-center items-center">
                      No admin requests found.
                    </p>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="pl-10">
            <Link to="/profile">
              <button className="bg-blue-300 text-black font-semibold mb-6 mr-6 px-8 py-2 rounded-lg hover:bg-blue-400">
                Back
              </button>
            </Link>
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
};

export default AdminRequest;
