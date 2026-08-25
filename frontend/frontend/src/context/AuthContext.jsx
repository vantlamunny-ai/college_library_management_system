import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import * as studentService from '../services/studentService';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';
import { looksLikeRollNumber } from '../utils/validation';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentProfileStatus, setStudentProfileStatus] = useState('idle'); // idle|loading|ready|unavailable

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStudentProfile(null);
    setStudentProfileStatus('idle');
  }, []);

  useEffect(() => {
    window.addEventListener('clms:unauthorized', logout);
    return () => window.removeEventListener('clms:unauthorized', logout);
  }, [logout]);

  const loadStudentProfile = useCallback(async () => {
    setStudentProfileStatus('loading');
    try {
      const res = await studentService.getMyStudentProfile();
      setStudentProfile(res.data);
      setStudentProfileStatus('ready');
    } catch {
      // No students row linked to this account yet (e.g. an Admin/Librarian
      // created the login but hasn't added the student record). Not fatal.
      setStudentProfile(null);
      setStudentProfileStatus('unavailable');
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect --
     This effect only re-runs when `user` changes identity (login/logout),
     never on every render — it derives/fetches studentProfile from that
     one dependency, which is exactly what effects are for. */
  useEffect(() => {
    if (user?.role !== 'Student') {
      setStudentProfile(null);
      setStudentProfileStatus('idle');
      return;
    }

    // Always goes to GET /students/me rather than reconstructing a partial
    // profile from the login response — the profile now carries bio,
    // interests, and a profile picture too, none of which the login
    // response should be bloated with (a photo can be a few hundred KB).
    loadStudentProfile();
  }, [user, loadStudentProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /**
   * @param {string} identifier email, roll number, or username — the login
   *   form has no role selector, so the shape of what was typed is what
   *   decides which field it's sent as. The backend alone determines the
   *   account's actual role from the database row and returns it in the
   *   response; nothing here ever assumes or requests a particular role.
   * @param {string} password
   */
  const login = useCallback(async (identifier, password) => {
    let credentials;
    if (identifier.includes('@')) {
      credentials = { email: identifier, password };
    } else if (looksLikeRollNumber(identifier)) {
      credentials = { roll_number: identifier, password };
    } else {
      credentials = { username: identifier, password };
    }

    const res = await authService.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      role: user?.role ?? null,
      initializing: false,
      studentProfile,
      studentProfileStatus,
      login,
      logout,
      reloadStudentProfile: loadStudentProfile,
    }),
    [user, token, studentProfile, studentProfileStatus, login, logout, loadStudentProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is intentional
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
