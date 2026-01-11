import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { 
  Restaurant, 
  Table, 
  CreateRestaurantDto, 
  UpdateRestaurantDto, 
  CreateTableDto, 
  UpdateTableDto,
  USER_ROLES
} from '@restaurant-reservation/shared';
import { useAppSelector } from '../../store/hooks';
import { restaurantService } from '../../services/restaurantService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { getErrorMessage } from '../../utils/apiError';

type Tab = 'restaurants' | 'tables';

export function AdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<Tab>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');

  // Modal States
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Restaurant | Table | null>(null);

  // Forms
  const [restaurantForm, setRestaurantForm] = useState<CreateRestaurantDto>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    timezone: 'UTC',
    openingTime: '09:00',
    closingTime: '22:00',
  });

  const [tableForm, setTableForm] = useState<CreateTableDto>({
    restaurantId: '',
    tableNumber: '',
    capacity: 2,
    minPartySize: 1,
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (activeTab === 'tables' && selectedRestaurantId) {
      fetchTables(selectedRestaurantId);
    }
  }, [activeTab, selectedRestaurantId]);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantService.getRestaurants();
      setRestaurants(response.data);
      if (response.data?.length > 0 && !selectedRestaurantId) {
        const firstRestaurant = response.data[0];
        if (firstRestaurant) {
          setSelectedRestaurantId(firstRestaurant.id);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const fetchTables = async (restaurantId: string) => {
    try {
      const response = await restaurantService.getTablesByRestaurant(restaurantId);
      setTables(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // --- Restaurant Handlers ---

  const handleRestaurantSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Construct clean DTO for update
        const updateData: UpdateRestaurantDto = {
            name: restaurantForm.name,
            address: restaurantForm.address,
            city: restaurantForm.city,
            state: restaurantForm.state,
            zipCode: restaurantForm.zipCode,
            timezone: restaurantForm.timezone || 'UTC',
            openingTime: restaurantForm.openingTime || '09:00',
            closingTime: restaurantForm.closingTime || '22:00',
        };
        // Only include optional fields if they have value
        if (restaurantForm.phone) updateData.phone = restaurantForm.phone;
        if (restaurantForm.email) updateData.email = restaurantForm.email;

        await restaurantService.updateRestaurant(editingItem.id, updateData);
        toast.success('Restaurant updated');
      } else {
        await restaurantService.createRestaurant(restaurantForm);
        toast.success('Restaurant created');
      }
      setIsRestaurantModalOpen(false);
      setEditingItem(null);
      fetchRestaurants();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">
          Delete this restaurant?
        </p>
        <p className="text-xs text-gray-500">
         This will delete all tables and reservations associated with this restaurant. This action cannot be undone.
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
                await restaurantService.deleteRestaurant(id);
                toast.success('Restaurant deleted successfully');
                fetchRestaurants();
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 5000, id: 'confirm-delete-restaurant' });
  };

  const openRestaurantModal = (restaurant?: Restaurant) => {
    if (restaurant) {
      setEditingItem(restaurant);
      setRestaurantForm({
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode,
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        timezone: restaurant.timezone,
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
      });
    } else {
      setEditingItem(null);
      setRestaurantForm({
        name: '', address: '', city: '', state: '', zipCode: '', 
        phone: '', email: '', timezone: 'UTC', openingTime: '09:00', closingTime: '22:00'
      });
    }
    setIsRestaurantModalOpen(true);
  };

  // --- Table Handlers ---

  const handleTableSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
         const updateData: UpdateTableDto = {
            tableNumber: tableForm.tableNumber,
            capacity: tableForm.capacity,
         };
         if (tableForm.minPartySize) updateData.minPartySize = tableForm.minPartySize;

        await restaurantService.updateTable(editingItem.id, updateData);
        toast.success('Table updated');
      } else {
        await restaurantService.createTable({
            ...tableForm,
            restaurantId: selectedRestaurantId
        });
        toast.success('Table created');
      }
      setIsTableModalOpen(false);
      setEditingItem(null);
      if (selectedRestaurantId) fetchTables(selectedRestaurantId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteTable = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">
          Delete this table?
        </p>
        <p className="text-xs text-gray-500">
         This action cannot be undone.
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
                await restaurantService.deleteTable(id);
                toast.success('Table deleted successfully');
                if (selectedRestaurantId) fetchTables(selectedRestaurantId);
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 5000, id: 'confirm-delete-table' });
  };

  const openTableModal = (table?: Table) => {
    if (table) {
      setEditingItem(table);
      // Ensure we fill all properties for the form state
      setTableForm({
        restaurantId: table.restaurantId,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        // Use default 1 if minPartySize is missing in table object (though it should be there)
        minPartySize: table.minPartySize || 1,
      });
    } else {
      setEditingItem(null);
      setTableForm({
        restaurantId: selectedRestaurantId,
        tableNumber: '',
        capacity: 2,
        minPartySize: 1,
      });
    }
    setIsTableModalOpen(true);
  };

  if (!user || user.role !== USER_ROLES.ADMIN) {
    return <div className="p-8 text-center text-red-600">Access Denied</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
            <button
                onClick={() => setActiveTab('restaurants')}
                className={`px-4 py-2 rounded-md ${activeTab === 'restaurants' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
                Restaurants
            </button>
            <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-md ${activeTab === 'tables' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
                Tables
            </button>
        </div>
      </div>

      {activeTab === 'restaurants' && (
        <div>
            <div className="mb-4 flex justify-end">
                <Button onClick={() => openRestaurantModal()}>Add Restaurant</Button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {restaurants.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{r.name}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{r.city}, {r.state}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{r.phone}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openRestaurantModal(r)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDeleteRestaurant(r.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div>
             <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Restaurant</label>
                <select
                    className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedRestaurantId}
                    onChange={(e) => setSelectedRestaurantId(e.target.value)}
                >
                    {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div className="mb-4 flex justify-end">
                <Button onClick={() => openTableModal()} disabled={!selectedRestaurantId}>Add Table</Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Party</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tables.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{t.tableNumber}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{t.capacity}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{t.minPartySize}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openTableModal(t)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDeleteTable(t.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {tables.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No tables found</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      )}

      {isRestaurantModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Restaurant' : 'Add Restaurant'}</h2>
                <form onSubmit={handleRestaurantSubmit} className="space-y-4">
                    <Input label="Name" value={restaurantForm.name} onChange={e => setRestaurantForm({...restaurantForm, name: e.target.value})} required />
                    <Input label="Address" value={restaurantForm.address} onChange={e => setRestaurantForm({...restaurantForm, address: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City" value={restaurantForm.city} onChange={e => setRestaurantForm({...restaurantForm, city: e.target.value})} required />
                        <Input label="State" value={restaurantForm.state} onChange={e => setRestaurantForm({...restaurantForm, state: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Zip Code" value={restaurantForm.zipCode} onChange={e => setRestaurantForm({...restaurantForm, zipCode: e.target.value})} required />
                        <Input label="Phone" value={restaurantForm.phone || ''} onChange={e => setRestaurantForm({...restaurantForm, phone: e.target.value})} />
                    </div>
                    <Input label="Email" value={restaurantForm.email || ''} onChange={e => setRestaurantForm({...restaurantForm, email: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="time" label="Opening Time" value={restaurantForm.openingTime || '09:00'} onChange={e => setRestaurantForm({...restaurantForm, openingTime: e.target.value})} />
                        <Input type="time" label="Closing Time" value={restaurantForm.closingTime || '22:00'} onChange={e => setRestaurantForm({...restaurantForm, closingTime: e.target.value})} />
                    </div>
                    <div className="flex gap-2 justify-end mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsRestaurantModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isTableModalOpen && (
         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Table' : 'Add Table'}</h2>
                <form onSubmit={handleTableSubmit} className="space-y-4">
                    <Input label="Table Number" value={tableForm.tableNumber} onChange={e => setTableForm({...tableForm, tableNumber: e.target.value})} required />
                    <Input type="number" label="Capacity" value={tableForm.capacity} onChange={e => setTableForm({...tableForm, capacity: parseInt(e.target.value)})} required min={1} />
                    <Input type="number" label="Min Party Size" value={tableForm.minPartySize || 1} onChange={e => setTableForm({...tableForm, minPartySize: parseInt(e.target.value)})} required min={1} />
                    
                    <div className="flex gap-2 justify-end mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsTableModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}
