export function useAuth() {
  const login = (password: string) => {
    if (password === "shop2024") {
      localStorage.setItem("admin_auth", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("admin_auth");
  };

  const isAuthenticated = () => {
    return localStorage.getItem("admin_auth") === "true";
  };

  return { login, logout, isAuthenticated };
}
