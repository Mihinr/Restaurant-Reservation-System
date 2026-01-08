import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Login successful!');
      // Redirect staff/admin to staff dashboard, customers to home
      if (result.payload.user.role === 'STAFF' || result.payload.user.role === 'ADMIN') {
        navigate('/staff');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Login
        </Button>
      </form>
    </div>
  );
}

