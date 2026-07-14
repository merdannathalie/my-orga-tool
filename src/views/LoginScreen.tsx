import { useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { cx } from "../utils/cx";
import styles from "./LoginScreen.module.scss";

type Props = {
  onSignedIn: () => void;
};

export const LoginScreen = ({ onSignedIn }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSignedIn();
    } catch {
      setError("Login fehlgeschlagen. E-Mail/Passwort prüfen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>Anmelden</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          required
          className={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          required
          className={cx(styles.input, styles.inputLast)}
        />
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? "Anmelden …" : "Anmelden"}
        </button>
      </form>
    </div>
  );
};
