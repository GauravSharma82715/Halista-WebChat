import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppData } from "./AppContext";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
});

interface ProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAppData();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user?._id) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      setOnlineUsers([]);
      return;
    }

    const userIdStr = String(user._id);

    const newSocket = io(chat_service, {
      query: {
        userId: userIdStr,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("🟢 Socket Connected:", newSocket.id, "for user:", userIdStr);
    });

    newSocket.on("getOnlineUser", (users: any[]) => {
      console.log("📡 Online Users Updated:", users);
      if (Array.isArray(users)) {
        setOnlineUsers(users.map((id) => String(id).trim()));
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔴 Socket Disconnected:", reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const SocketData = () => useContext(SocketContext);
