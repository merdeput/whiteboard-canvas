import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import { login } from "../api/auth.api";
import { loginSuccess } from "../features/auth/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    try {
      const data = await login({
        username,
        password,
      });

      dispatch(
        loginSuccess({
          user: data.user,
          token: data.accessToken,
        })
      );

      navigate("/room/demo");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    }
  }

  return (
    <div>
      <h1>Login</h1>

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
          Login
        </button>
      </form>

      {error && <p>{error}</p>}

      <Link to="/register">
        Register
      </Link>
    </div>
  );
}

export default LoginPage;