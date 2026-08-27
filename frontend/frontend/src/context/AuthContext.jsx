import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authService from "../services/authService";
import * as studentService from "../services/studentService";

import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "../api/client";

import { looksLikeRollNumber } from "../utils/validation";

export const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read stored user:", error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [studentProfile, setStudentProfile] = useState(null);

  const [studentProfileStatus, setStudentProfileStatus] =
    useState("idle");

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    setToken(null);
    setUser(null);

    setStudentProfile(null);
    setStudentProfileStatus("idle");
  }, []);

  // =========================================================
  // HANDLE UNAUTHORIZED
  // =========================================================

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener(
      "clms:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "clms:unauthorized",
        handleUnauthorized
      );
    };
  }, [logout]);

  // =========================================================
  // LOAD STUDENT PROFILE
  // =========================================================

  const loadStudentProfile = useCallback(async () => {
    setStudentProfileStatus("loading");

    try {
      const response =
        await studentService.getMyStudentProfile();

      // apiClient returns response.data directly
      setStudentProfile(response);

      setStudentProfileStatus("ready");
    } catch (error) {
      console.error(
        "Student profile error:",
        error
      );

      setStudentProfile(null);
      setStudentProfileStatus("unavailable");
    }
  }, []);

  // =========================================================
  // LOAD STUDENT PROFILE WHEN USER CHANGES
  // =========================================================

  useEffect(() => {
    if (!user || user.role !== "Student") {
      setStudentProfile(null);
      setStudentProfileStatus("idle");
      return;
    }

    loadStudentProfile();
  }, [user, loadStudentProfile]);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = useCallback(
    async (identifier, password) => {
      let credentials;

      const cleanIdentifier = identifier.trim();

      // Login using Email
      if (cleanIdentifier.includes("@")) {
        credentials = {
          email: cleanIdentifier,
          password,
        };
      }

      // Login using Roll Number
      else if (looksLikeRollNumber(cleanIdentifier)) {
        credentials = {
          roll_number: cleanIdentifier,
          password,
        };
      }

      // Login using Username
      else {
        credentials = {
          username: cleanIdentifier,
          password,
        };
      }

      console.log("Login credentials:", {
        ...credentials,
        password: "******",
      });

      const response =
        await authService.login(credentials);

      console.log("Login response:", response);

      /*
       * Depending on your apiClient/authService,
       * response can be either:
       *
       * { token, user }
       *
       * OR
       *
       * { data: { token, user } }
       */

      const loginData =
        response?.data || response;

      const newToken =
        loginData?.token;

      const newUser =
        loginData?.user;

      // Check server response
      if (!newToken || !newUser) {
        console.error(
          "Invalid login response:",
          response
        );

        throw new Error(
          "Invalid login response from server"
        );
      }

      // =====================================================
      // SAVE LOGIN DATA
      // =====================================================

      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        newToken
      );

      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(newUser)
      );

      // =====================================================
      // UPDATE REACT STATE
      // =====================================================

      setToken(newToken);
      setUser(newUser);

      // Clear old student profile
      setStudentProfile(null);
      setStudentProfileStatus("idle");

      return newUser;
    },
    []
  );

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = useMemo(
    () => ({
      user,

      token,

      isAuthenticated:
        Boolean(token && user),

      role:
        user?.role ?? null,

      initializing: false,

      studentProfile,

      studentProfileStatus,

      login,

      logout,

      reloadStudentProfile:
        loadStudentProfile,
    }),
    [
      user,
      token,
      studentProfile,
      studentProfileStatus,
      login,
      logout,
      loadStudentProfile,
    ]
  );

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================================
// useAuth HOOK
// ===========================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

export default useAuth;