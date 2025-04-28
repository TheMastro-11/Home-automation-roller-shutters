import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { fetchApi, sha256 } from '../utils/api'; // Assumendo che fetchApi e sha256 siano in utils/api.js

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (formData) => {
    setError('');
    setLoading(true);
    try {
      const hashedPassword = await sha256(formData.password); //
      const userData = {
        username: formData.username,
        password: hashedPassword,
      }; //

      // Assicurati che fetchApi e sha256 siano disponibili
      await fetchApi("/api/auth/register", "POST", userData, {}, false); //

      alert("Registrazione completata! Effettua il login."); //
      navigate("/login"); // Reindirizza al login dopo la registrazione

    } catch (err) {
      console.error("Registration failed:", err); //
      setError(err.message || "Registrazione fallita. Riprova."); //
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
       <div className="container"> {/* Potresti voler limitare la larghezza qui */}
        <div className="row justify-content-center">
          <div className="col-md-4">
            <h2 className="text-center">Register</h2> {/* */}
            {error && <div className="alert alert-danger">{error}</div>}
            <AuthForm
              onSubmit={handleRegister}
              buttonText="Register"
              loading={loading}
              isRegisterForm={true}
            />
            <p className="mt-3 text-center">
              Hai già un account? <Link to="/login">Login</Link> {/* */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;