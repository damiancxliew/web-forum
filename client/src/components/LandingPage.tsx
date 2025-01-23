import React from "react";
import { useNavigate } from "react-router-dom";
import "../Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Navbar Section */}
      <nav className="navbar">
        {/* Logo on the left */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          Web Forum
        </div>
        {/* Login and Signup buttons on the right */}
        <div className="navbar-buttons">
          <button
            onClick={() => navigate("/login")}
            className="button button-login"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="button button-signup"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Main Content Section */}
      <div className="">
        {/* Logo Section */}
        <div className="logo-section flex">
          <div className="logo-box flex">
            <h1 className="logo-title">Technical Web Forum</h1>
            <h2 className="logo-subtitle">Damian Liew</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
