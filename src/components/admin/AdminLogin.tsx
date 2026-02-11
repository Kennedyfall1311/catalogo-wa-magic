import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi, isPostgresMode } from "@/lib/api-client";

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string) => Promise<{ error: any }>;
}

export function AdminLogin({ onLogin, onSignUp }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error: err } = await onSignUp(email, password);
      if (err) {
        setError(err.message);
      } else {
        setMessage("Conta criada! Verifique seu e-mail para confirmar, depois faça login.");
        setIsSignUp(false);
      }
    } else {
      const { error: err } = await onLogin(email, password);
      if (err) setError(err.message);
    }
    setLoading(false);
  };

  const handleSetupAdmin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authApi.setupAdmin();
      if (result.error) {
        setError(result.error.message || "Erro ao configurar admin");
      } else {
        setMessage("Permissão de admin concedida! Recarregue a página.");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Área Administrativa</h1>
        <p className="text-sm text-muted-foreground text-center">
          {isSignUp ? "Crie sua conta" : "Faça login para acessar o painel"}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full rounded-lg border bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
          minLength={6}
          className="w-full rounded-lg border bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-whatsapp">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          className="w-full text-center text-sm text-muted-foreground underline"
        >
          {isSignUp ? "Já tem conta? Faça login" : "Criar nova conta"}
        </button>

        {!isPostgresMode() && (
          <button
            type="button"
            onClick={handleSetupAdmin}
            disabled={loading}
            className="w-full text-center text-xs text-muted-foreground underline"
          >
            Tornar minha conta Admin (primeiro acesso)
          </button>
        )}

        <Link to="/" className="block text-center text-sm text-muted-foreground underline">
          Voltar ao catálogo
        </Link>
      </form>
    </div>
  );
}
