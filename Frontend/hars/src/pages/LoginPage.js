import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { fetchApi, sha256 } from '../utils/api'; // Assumendo che fetchApi e sha256 siano in utils/api.js

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData) => {
    setError('');
    setLoading(true);
    try {
      const hashedPassword = await sha256(formData.password);
      const loginData = {
        username: formData.username,
        password: hashedPassword,
      };

      const result = await fetchApi("/api/auth/authenticate", 'POST', loginData, {}, false);

      if (result && result.jwt) {
        localStorage.setItem("jwt", result.jwt);
        navigate("/dashboard");
      } else {
        throw new Error(result?.message || "Credenziali non valide o token mancante."); //
      }
    } catch (err) {
      console.error("Login failed:", err); //
      setError(err.message || "Login fallito. Riprova."); //
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="container"> {/* Potresti voler limitare la larghezza qui */}
        <div className="row justify-content-center">
          <div className="col-md-4">
            <h2 className="text-center">Login</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <AuthForm
              onSubmit={handleLogin}
              buttonText="Login"
              loading={loading}
              isRegisterForm={false}
            />
            <p className="mt-3 text-center">
              Non hai un account? <Link to="/register">Registrati</Link> {/* */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;