import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load user on app start
  const load = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Load user failed:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);

      return data;
    } catch (err) {
      console.error('Login error:', err);
      throw err; // important for UI error handling
    }
  };

  // 📝 REGISTER
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);

      return data;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 🔄 REFRESH USER (useful after profile update)
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Refresh user failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}



// import { createContext, useContext, useEffect, useState } from 'react';
// import api from '../api/client.js';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const load = async () => {
//     const t = localStorage.getItem('token');
//     if (!t) {
//       setUser(null);
//       setLoading(false);
//       return;
//     }
//     try {
//       const { data } = await api.get('/auth/me');
//       setUser(data.user);
//     } catch {
//       localStorage.removeItem('token');
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const login = async (email, password) => {
//     const { data } = await api.post('/auth/login', { email, password });
//     localStorage.setItem('token', data.token);
//     setUser(data.user);
//     return data;
//   };

//   const register = async (name, email, password) => {
//     const { data } = await api.post('/auth/register', { name, email, password });
//     localStorage.setItem('token', data.token);
//     setUser(data.user);
//     return data;
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//   };

//   const refreshUser = async () => {
//     const { data } = await api.get('/auth/me');
//     setUser(data.user);
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }
