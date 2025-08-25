import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Package, 
  Award, 
  Settings,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  Mail
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Employee {
  id: string;
  email: string;
  name: string;
  points: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  stock: number;
  category: string;
  imageUrl: string;
}

interface Order {
  id: string;
  employeeId: string;
  products: any[];
  totalPoints: number;
  status: string;
  createdAt: string;
}

export function CorporateDashboard() {
  const { userProfile, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    email: '',
    name: '',
    points: 100,
  });

  // Bulk employee upload
  const [bulkEmployees, setBulkEmployees] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Load employees for this corporate
      const employeesQuery = query(
        collection(db, 'employees'),
        where('corporateId', '==', currentUser?.uid)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));
      setEmployees(employeesData);

      // Load all available products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setAvailableProducts(productsData);

      // Load orders for this corporate
      const ordersQuery = query(
        collection(db, 'orders'),
        where('corporateId', '==', currentUser?.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);

      // Load selected products for this corporate
      const corporateDoc = await getDocs(query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', currentUser?.uid)
      ));
      if (!corporateDoc.empty) {
        const settings = corporateDoc.docs[0].data();
        setSelectedProducts(settings.selectedProducts || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employees'), {
        ...employeeForm,
        corporateId: currentUser?.uid,
        corporateCompany: userProfile?.companyName,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      
      setEmployeeForm({
        email: '',
        name: '',
        points: 100,
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkEmployees.trim()) return;

    try {
      const lines = bulkEmployees.trim().split('\n');
      const batch = [];

      for (const line of lines) {
        const [email, name, points = '100'] = line.split(',').map(s => s.trim());
        if (email && name) {
          batch.push({
            email,
            name,
            points: parseInt(points),
            corporateId: currentUser?.uid,
            corporateCompany: userProfile?.companyName,
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }
      }

      for (const employee of batch) {
        await addDoc(collection(db, 'employees'), employee);
      }

      setBulkEmployees('');
      loadData();
    } catch (error) {
      console.error('Error bulk uploading employees:', error);
    }
  };

  const handleProductSelection = async (productId: string, selected: boolean) => {
    const newSelection = selected 
      ? [...selectedProducts, productId]
      : selectedProducts.filter(id => id !== productId);
    
    setSelectedProducts(newSelection);
    
    try {
      // Update or create corporate settings
      const corporateSettingsQuery = query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', currentUser?.uid)
      );
      const existingSettings = await getDocs(corporateSettingsQuery);
      
      if (existingSettings.empty) {
        await addDoc(collection(db, 'corporateSettings'), {
          corporateId: currentUser?.uid,
          selectedProducts: newSelection,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await updateDoc(existingSettings.docs[0].ref, {
          selectedProducts: newSelection,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating product selection:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await deleteDoc(doc(db, 'employees', employeeId));
        loadData();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleUpdateEmployeePoints = async (employeeId: string, newPoints: number) => {
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        points: newPoints,
        updatedAt: new Date().toISOString(),
      });
      loadData();
    } catch (error) {
      console.error('Error updating employee points:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    totalEmployees: employees.length,
    totalOrders: orders.length,
    selectedProductsCount: selectedProducts.length,
    totalPointsAllocated: employees.reduce((sum, emp) => sum + emp.points, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Corporate Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.contactName} from {userProfile?.companyName}
          </p>
          {userProfile?.status === 'pending' && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md">
              Your account is pending approval. Please wait for admin approval to access all features.
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.selectedProductsCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPointsAllocated}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {userProfile?.status === 'approved' ? (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  {['overview', 'employees', 'products', 'orders', 'settings'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-4 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Recent Employee Activity</h3>
                        <div className="space-y-2">
                          {employees.slice(0, 5).map(employee => (
                            <div key={employee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-sm text-gray-600">{employee.email}</p>
                              </div>
                              <span className="text-blue-600 font-medium">{employee.points} points</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Recent Orders</h3>
                        <div className="space-y-2">
                          {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                <p className="text-sm text-gray-600">{order.totalPoints} points</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => setActiveTab('employees')}
                          className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add Employee
                        </button>
                        <button
                          onClick={() => setActiveTab('products')}
                          className="flex items-center justify-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Package className="h-5 w-5 mr-2" />
                          Manage Products
                        </button>
                        <div className="flex items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-lg">
                          <Eye className="h-5 w-5 mr-2" />
                          <span>Sub-page: /company/{userProfile?.slug || 'company'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'employees' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Employee Management</h2>
                    </div>

                    {/* Add Employee Forms */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Single Employee Form */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Add Single Employee</h3>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                          <input
                            type="email"
                            placeholder="Employee Email"
                            value={employeeForm.email}
                            onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Employee Name"
                            value={employeeForm.name}
                            onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Initial Points"
                            value={employeeForm.points}
                            onChange={(e) => setEmployeeForm({...employeeForm, points: parseInt(e.target.value)})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                          >
                            Add Employee
                          </button>
                        </form>
                      </div>

                      {/* Bulk Upload Form */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Bulk Upload Employees</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CSV Format: email,name,points (one per line)
                            </label>
                            <textarea
                              value={bulkEmployees}
                              onChange={(e) => setBulkEmployees(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                              placeholder="john@company.com,John Doe,100&#10;jane@company.com,Jane Smith,150"
                            />
                          </div>
                          <button
                            onClick={handleBulkUpload}
                            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                          >
                            Upload Employees
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Employees List */}
                    <div className="bg-white rounded-lg border">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium">Current Employees ({employees.length})</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {employees.map(employee => (
                          <div key={employee.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <p className="text-sm text-gray-500">{employee.email}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={employee.points}
                                  onChange={(e) => handleUpdateEmployeePoints(employee.id, parseInt(e.target.value))}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <span className="text-sm text-gray-500">points</span>
                              </div>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Product Selection</h2>
                      <p className="text-gray-600">Select products available to your employees</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableProducts.map(product => (
                        <div key={product.id} className="border rounded-lg overflow-hidden">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Select</span>
                              </label>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-600 font-medium">{product.pointCost} points</span>
                              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Order History</h2>
                    <div className="bg-white rounded-lg border">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Points
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(order => {
                              const employee = employees.find(emp => emp.id === order.employeeId);
                              return (
                                <tr key={order.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{order.id.slice(-8)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {employee?.name || 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.totalPoints}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Company Settings</h2>
                    <div className="space-y-6">
                      {/* Branding Settings */}
                      <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-medium mb-4">Branding & Customization</h3>
                        <BrandingSettings corporateId={currentUser?.uid || ''} onUpdate={loadData} />
                      </div>

                      <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-medium mb-4">Company Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={userProfile?.companyName || ''}
                              disabled
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contact Name
                            </label>
                            <input
                              type="text"
                              value={userProfile?.contactName || ''}
                              disabled
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={userProfile?.email || ''}
                              disabled
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={userProfile?.phone || ''}
                              disabled
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-medium mb-4">Employee Access Link</h3>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800 mb-2">
                            Share this link with your employees to access their gifting portal:
                          </p>
                          <div className="flex items-center space-x-2">
                            <code className="bg-white px-3 py-2 rounded text-sm flex-1">
                              {window.location.origin}/company/{userProfile?.slug || 'your-company'}
                            </code>
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/company/${userProfile?.slug || 'your-company'}`;
                                navigator.clipboard.writeText(link);
                                alert('Link copied to clipboard!');
                              }}
                              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4">
              <Mail className="h-16 w-16 text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
            <p className="text-gray-600 mb-4">
              Thank you for registering with GiftFlow Pro. Your corporate account is currently under review 
              by our admin team. You will receive an email notification once your account has been approved.
            </p>
            <p className="text-sm text-gray-500">
              This process typically takes 1-2 business days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// Branding Settings Component
function BrandingSettings({ corporateId, onUpdate }: { corporateId: string, onUpdate: () => void }) {
  const [branding, setBranding] = useState({
    logo: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    greeting: '',
    festivalGreeting: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranding();
  }, [corporateId]);

  const loadBranding = async () => {
    try {
      const settingsQuery = query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', corporateId)
      );
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (!settingsSnapshot.empty) {
        const settings = settingsSnapshot.docs[0].data();
        if (settings.branding) {
          setBranding({
            logo: settings.branding.logo || '',
            primaryColor: settings.branding.primaryColor || '#2563eb',
            secondaryColor: settings.branding.secondaryColor || '#1d4ed8',
            greeting: settings.branding.greeting || '',
            festivalGreeting: settings.branding.festivalGreeting || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settingsQuery = query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', corporateId)
      );
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (settingsSnapshot.empty) {
        await addDoc(collection(db, 'corporateSettings'), {
          corporateId,
          branding,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(settingsSnapshot.docs[0].ref, {
          branding,
          updatedAt: new Date().toISOString()
        });
      }
      
      alert('Branding settings saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error saving branding:', error);
      alert('Error saving branding settings.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSaveBranding} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Logo URL
        </label>
        <input
          type="url"
          value={branding.logo}
          onChange={(e) => setBranding({...branding, logo: e.target.value})}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/logo.png"
        />
        {branding.logo && (
          <div className="mt-2">
            <img src={branding.logo} alt="Logo preview" className="h-12 w-12 object-contain" />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Color
          </label>
          <input
            type="color"
            value={branding.secondaryColor}
            onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Greeting
        </label>
        <input
          type="text"
          value={branding.greeting}
          onChange={(e) => setBranding({...branding, greeting: e.target.value})}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Welcome to our Employee Portal"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Festival/Special Greeting
        </label>
        <input
          type="text"
          value={branding.festivalGreeting}
          onChange={(e) => setBranding({...branding, festivalGreeting: e.target.value})}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Happy Holidays! 🎄"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Branding Settings'}
      </button>
    </form>
  );
}