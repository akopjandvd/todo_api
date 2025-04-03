import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "../config";

export default function useTokenHandler(
  token,
  setToken,
  setLoggedInUser,
  logout
) {
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const exp = decoded.exp;
      const now = Date.now() / 1000;
      const expiresIn = exp - now;

      if (expiresIn <= 0) {
        logout();
        return;
      }

      setLoggedInUser(decoded.sub);

      const refreshTime = Math.max(expiresIn - 30, 10);
      const timer = setInterval(async () => {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          localStorage.setItem("token", data.access_token);
        } else {
          logout();
        }
      }, refreshTime * 1000);

      return () => clearInterval(timer);
    } catch (e) {
      logout();
    }
  }, [token]);
}
