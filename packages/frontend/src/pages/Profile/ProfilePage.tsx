import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { authService } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 sm:px-6">Please log in to view your profile.</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });
      dispatch(setUser(response.data));
      setIsEditing(false);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      let errorMessage = 'Failed to update profile';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
        errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Profile</h1>
        {!isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)} className="text-sm">
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="border-b border-gray-200 pb-3 sm:pb-4">
            <p className="text-sm sm:text-base">
              <strong className="block text-gray-600 mb-1">Email:</strong>
              <span className="text-gray-900">{user.email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <p className="text-sm sm:text-base">
              <strong className="block text-gray-600 mb-1">Role:</strong>
              <span className="text-gray-900 capitalize">{user.role.toLowerCase()}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-3 sm:space-y-4">
          <div className="border-b border-gray-200 pb-3 sm:pb-4">
            <p className="text-sm sm:text-base">
              <strong className="block text-gray-600 mb-1">Name:</strong>
              <span className="text-gray-900">{user.firstName} {user.lastName}</span>
            </p>
          </div>
          <div className="border-b border-gray-200 pb-3 sm:pb-4">
            <p className="text-sm sm:text-base">
              <strong className="block text-gray-600 mb-1">Email:</strong>
              <span className="text-gray-900">{user.email}</span>
            </p>
          </div>
          {user.phone && (
            <div className="border-b border-gray-200 pb-3 sm:pb-4">
              <p className="text-sm sm:text-base">
                <strong className="block text-gray-600 mb-1">Phone:</strong>
                <span className="text-gray-900">{user.phone}</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-sm sm:text-base">
              <strong className="block text-gray-600 mb-1">Role:</strong>
              <span className="text-gray-900 capitalize">{user.role.toLowerCase()}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

