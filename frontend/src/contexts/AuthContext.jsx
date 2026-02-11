import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 🔹 Inicializa sesión al montar la app
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get("/users/refreshtoken");
        setAccessToken(res.data.accessToken);
        setIsAuthenticated(true);
      } catch (err) {
        setAccessToken(null);
        setIsAuthenticated(false);
      }
    };
    initAuth();
  }, []);

  // 🔹 Login
  const login = async (credentials) => {
    const res = await api.post("/users/login", credentials);
    setAccessToken(res.data.accessToken);
    setIsAuthenticated(true);
  };

  // 🔹 Refresh token manual
  const refreshToken = async () => {
    try {
      const res = await api.get("/users/refreshtoken");
      setAccessToken(res.data.accessToken);
      setIsAuthenticated(true);
      return res.data.accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await api.delete("/users/refreshtoken", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      setAccessToken(null);
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
