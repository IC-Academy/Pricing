import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "../../types";
import { usersRepo, sessionStore } from "../../data/db";

interface AuthContextValue {
  currentUser: User | null;
  allUsers: User[];
  loginAs: (userId: string) => void;
  logout: () => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>(() => usersRepo.getAll());
  const [userId, setUserId] = useState<string | null>(() => sessionStore.get().userId);

  useEffect(() => {
    sessionStore.set({ userId });
  }, [userId]);

  const currentUser = useMemo(() => allUsers.find((u) => u.id === userId) ?? null, [allUsers, userId]);

  const loginAs = (id: string) => setUserId(id);
  const logout = () => setUserId(null);
  const refreshUsers = () => setAllUsers(usersRepo.getAll());

  return (
    <AuthContext.Provider value={{ currentUser, allUsers, loginAs, logout, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
