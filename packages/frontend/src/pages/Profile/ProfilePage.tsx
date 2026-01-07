import { useAppSelector } from '../../store/hooks';

export function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Profile</h1>
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
    </div>
  );
}

