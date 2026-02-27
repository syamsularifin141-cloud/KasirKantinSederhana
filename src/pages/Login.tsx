import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/admin');
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-serif font-bold text-stone-800 text-center mb-2">Login Admin</h1>
        <p className="text-stone-600 text-center mb-8">Masukkan kredensial Anda untuk melanjutkan.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-stone-700 font-semibold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="default: admin"
            />
          </div>
          <div className="mb-6">
            <label className="block text-stone-700 font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
              placeholder="default: admin"
            />
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#5A5A40] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
