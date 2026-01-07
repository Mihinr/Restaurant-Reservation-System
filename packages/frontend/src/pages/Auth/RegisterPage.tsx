import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/authSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register(formData));
    if (register.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <Input
          type="email"
          label="Email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          type="password"
          label="Password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
        <Input
          label="Phone (optional)"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
        />
        {error && <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>}
        <Button type="submit" isLoading={isLoading} className="w-full">
          Register
        </Button>
      </form>
    </div>
  );
}
