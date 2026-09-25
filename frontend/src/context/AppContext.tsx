import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const rawBackendUrl =
  (import.meta.env.VITE_BACKEND_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  "http://localhost:5000";

export const user_service = rawBackendUrl.replace(/\/+$/, "");
export const chat_service = rawBackendUrl.replace(/\/+$/, "");

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}

export const getToken = (): string => {
  try {
    return localStorage.getItem("token") || Cookies.get("token") || "";
  } catch (e) {
    return Cookies.get("token") || "";
  }
};

export const saveToken = (token: string) => {
  try {
    localStorage.setItem("token", token);
  } catch (e) {}
  try {
    Cookies.set("token", token, {
      expires: 15,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
      path: "/",
    });
  } catch (e) {}
};

export const clearToken = () => {
  try {
    localStorage.removeItem("token");
  } catch (e) {}
  try {
    Cookies.remove("token");
  } catch (e) {}
};

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthData: (user: User, token: string) => void;
  logoutUser: () => Promise<void>;
  fetchUser: (tokenOverride?: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const setAuthData = (userData: User, token: string) => {
    saveToken(token);
    setUser(userData);
    setIsAuth(true);
    setLoading(false);
  };

  async function fetchUser(tokenOverride?: string) {
    try {
      const token = tokenOverride || getToken();
      if (!token) {
        setLoading(false);
        setIsAuth(false);
        setUser(null);
        return;
      }

      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
      setLoading(false);
      fetchChats();
      fetchUsers();
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  async function logoutUser() {
    clearToken();
    setUser(null);
    setIsAuth(false);
    toast.success("User Logged Out");
  }

  const [chats, setChats] = useState<Chats[] | null>(null);
  async function fetchChats() {
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChats(data.chats);
    } catch (error) {
      console.log(error);
    }
  }

  const [users, setUsers] = useState<User[] | null>(null);

  async function fetchUsers() {
    const token = getToken();
    if (!token) return;

    try {
      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        setAuthData,
        loading,
        logoutUser,
        fetchUser,
        fetchChats,
        fetchUsers,
        chats,
        users,
        setChats,
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          },
        }}
      />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};
