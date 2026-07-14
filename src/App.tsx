import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { AccessOrg } from "./AccessOrg";
import { LoginScreen } from "./views/LoginScreen";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "in"; user: User }
  | { status: "out"; user: null };

const AppRoot = () => {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAuthState({ status: "in", user });
      else setAuthState({ status: "out", user: null });
    });
    return () => unsub();
  }, []);

  if (authState.status === "loading") {
    return (
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100vh", background: "#201F22", color: "#F1ECE6",
          fontFamily: "'Atkinson Hyperlegible', sans-serif",
        }}
      >
        Lädt …
      </div>
    );
  }

  if (authState.status === "out") {
    return <LoginScreen onSignedIn={() => {}} />;
  }

  return <AccessOrg uid={authState.user.uid} onSignOut={() => signOut(auth)} />;
};

export default AppRoot;
