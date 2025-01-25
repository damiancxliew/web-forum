import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiRequest } from "../api/apiRequest";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isValidEmail = (email: string) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signupUser = async () => {
    // Input validation
    if (!email || !name || !password || !confirmPassword) {
      setErrorMessage("Please enter all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match. Please ensure both passwords are the same."
      );
      return;
    }

    try {
      console.log(name, email, password);
      const response = await apiRequest("signup", "POST", "", {
        username: name,
        email: email,
        password: password,
      });
      if (response.success) {
        console.log("User registered successfully:", response.data);
        navigate("/login");
      } else {
        console.error("Signup error:", response.message);
        setErrorMessage(
          "User already exists. Please try again with a different email."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMessage("An error occurred during signup. Please try again.");
    }
  };

  return (
    <div className="main-container">
      {/* Left Section: Logo */}
      <div className="logo-section">
        <div className="logo-box"></div>
      </div>

      {/* Right Section: Form */}
      <div className="form-container">
        <div className="tab-buttons">
          <button
            className="button button-tab-login-off"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            className="button button-tab-signup-on"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button onClick={signupUser} className="button confirm-button">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default Signup;
