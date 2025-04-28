import React, { useState } from 'react';

function AuthForm({ onSubmit, buttonText, loading, isRegisterForm }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username || !password) {
      alert("Inserisci username e password."); // Semplice validazione
      return;
    }
    onSubmit({ username, password });
  };

  // Nomi degli ID diversi per login e registrazione come nell'HTML originale
  const usernameId = isRegisterForm ? "username" : "loginname"; //
  const passwordId = isRegisterForm ? "password" : "loginPassword"; //

  return (
    <form onSubmit={handleSubmit} id={isRegisterForm ? 'registerForm' : 'loginForm'}> {/* */}
      <div className="mb-3">
        <label htmlFor={usernameId} className="form-label">Username</label> {/* */}
        <input
          type="text"
          id={usernameId} //
          className="form-control" //
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required //
        />
      </div>
      <div className="mb-3">
        <label htmlFor={passwordId} className="form-label">Password</label> {/* */}
        <input
          type="password"
          id={passwordId} //
          className="form-control" //
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required //
        />
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={loading}> {/* */}
        {loading ? 'Caricamento...' : buttonText}
      </button>
    </form>
  );
}

export default AuthForm;