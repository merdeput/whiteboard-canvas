import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";


import "../styles/RegisterPage.css"

import { register } from "../api/auth.api";

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    try {
      await register({
        username,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed"
      );
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Register</h1>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button type="submit">
            Register
          </button>
        </form>

        {error && <p>{error}</p>}

        <Link to="/login">
          Login
        </Link>
      </div>
    </div>
  );
}

export default RegisterPage;