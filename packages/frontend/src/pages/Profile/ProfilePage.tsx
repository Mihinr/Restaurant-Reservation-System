import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { authService } from '../../services/authService';
import { setUser, logout } from '../../store/slices/authSlice';
import { getErrorMessage } from '../../utils/apiError';
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
      const updateData: { firstName: string; lastName: string; phone?: string } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
      };
      if (formData.phone) {
        updateData.phone = formData.phone;
      }
      const response = await authService.updateProfile(updateData);
      dispatch(setUser(response.data));
      setIsEditing(false);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
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
      {user.role === 'CUSTOMER' && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              toast(
                (t) => (
                  <div className="flex flex-col gap-3">
                    <p className="font-semibold">
                      Are you sure you want to delete your account?
                    </p>
                    <p className="text-xs text-gray-500">
                      This action cannot be undone. All your data will be permanently removed.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          toast.dismiss(t.id);
                          try {
                            await authService.deleteProfile();
                            dispatch(logout());
                            toast.success('Account deleted successfully');
                            // Navigate to home or login is handled by protected route or app state change
                            window.location.href = '/login';
                          } catch (error) {
                            toast.error(getErrorMessage(error));
                          }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                      >
                        Yes, Delete My Account
                      </button>
                    </div>
                  </div>
                ),
                {
                  duration: Infinity,
                  id: 'confirm-delete-account',
                }
              );
            }}
          >
            Delete Account
          </Button>
        </div>
      )}
    </div>
  );
}

