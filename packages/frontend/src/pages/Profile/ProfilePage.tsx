import { useAppSelector } from '../../store/hooks';

export function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
        <p><strong>Role:</strong> {user.role}</p>
      </div>
    </div>
  );
}

