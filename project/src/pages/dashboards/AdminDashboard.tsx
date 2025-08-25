import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Product {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  stock: number;
  category: string;
  imageUrl: string;
  status: 'active' | 'inactive';
}

interface Order {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  corporateId: string;
  corporateName: string;
  shippingAddress: any;
  products: any[];
  totalPoints: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

interface Corporate {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function AdminDashboard() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorporateOrders, setSelectedCorporateOrders] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    pointCost: 0,
    stock: 0,
    category: '',
    imageUrl: '',
  });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsData);

      // Load orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);

      // Load corporates
      const corporatesSnapshot = await getDocs(collection(db, 'users'));
      const corporatesData = corporatesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role === 'corporate') as Corporate[];
      setCorporates(corporatesData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...productForm,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      
      setProductForm({
        name: '',
        description: '',
        pointCost: 0,
        stock: 0,
        category: '',
        imageUrl: '',
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), productForm);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        pointCost: 0,
        stock: 0,
        category: '',
        imageUrl: '',
      });
      loadData();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleApproveCorporate = async (corporateId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', corporateId), { status });
      loadData();
    } catch (error) {
      console.error('Error updating corporate status:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
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
    totalOrders: orders.length,
    totalCorporates: corporates.filter(c => c.status === 'approved').length,
    totalProducts: products.length,
    pendingApprovals: corporates.filter(c => c.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.contactName || 'Admin'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Corporates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCorporates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {['overview', 'products', 'orders', 'corporates'].map((tab) => (
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
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Low Stock Alerts</h3>
                    <div className="space-y-2">
                      {products.filter(p => p.stock < 10).slice(0, 5).map(product => (
                        <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.stock} remaining</p>
                          </div>
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Product Management</h2>
                </div>

                {/* Add Product Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <form onSubmit={editingProduct ? (e) => {
                    e.preventDefault();
                    handleUpdateProduct(editingProduct);
                  } : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Point Cost"
                      value={productForm.pointCost}
                      onChange={(e) => setProductForm({...productForm, pointCost: parseInt(e.target.value)})}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Stock Quantity"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Image URL"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                      className="border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="border border-gray-300 rounded-md px-3 py-2 md:col-span-2"
                      rows={3}
                      required
                    />
                    <div className="md:col-span-2 flex space-x-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                              name: '',
                              description: '',
                              pointCost: 0,
                              stock: 0,
                              category: '',
                              imageUrl: '',
                            });
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Products List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <div key={product.id} className="border rounded-lg overflow-hidden">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-600 font-medium">{product.pointCost} points</span>
                          <span className={`text-sm ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product.id);
                              setProductForm({
                                name: product.name,
                                description: product.description,
                                pointCost: product.pointCost,
                                stock: product.stock,
                                category: product.category,
                                imageUrl: product.imageUrl,
                              });
                            }}
                            className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Order Management</h2>
                
                {selectedOrderDetails ? (
                  <OrderDetailsView 
                    order={selectedOrderDetails} 
                    onBack={() => setSelectedOrderDetails(null)}
                    onUpdateStatus={handleUpdateOrderStatus}
                  />
                ) : selectedCorporateOrders ? (
                  <CorporateOrdersView 
                    corporateId={selectedCorporateOrders}
                    orders={orders.filter(order => order.corporateId === selectedCorporateOrders)}
                    onBack={() => setSelectedCorporateOrders(null)}
                    onViewOrder={setSelectedOrderDetails}
                    onUpdateStatus={handleUpdateOrderStatus}
                  />
                ) : (
                  <CorporateOrdersOverview 
                    orders={orders}
                    corporates={corporates}
                    onSelectCorporate={setSelectedCorporateOrders}
                  />
                )}
              </div>
            )}

            {activeTab === 'corporates' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Corporate Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {corporates.map(corporate => (
                        <tr key={corporate.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {corporate.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {corporate.contactName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {corporate.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              corporate.status === 'approved' ? 'bg-green-100 text-green-800' :
                              corporate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {corporate.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {corporate.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveCorporate(corporate.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleApproveCorporate(corporate.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Corporate Orders Overview Component
function CorporateOrdersOverview({ 
  orders, 
  corporates, 
  onSelectCorporate 
}: { 
  orders: Order[], 
  corporates: Corporate[], 
  onSelectCorporate: (corporateId: string) => void 
}) {
  const corporateOrderStats = corporates.map(corporate => {
    const corporateOrders = orders.filter(order => order.corporateId === corporate.id);
    return {
      ...corporate,
      orderCount: corporateOrders.length,
      totalPoints: corporateOrders.reduce((sum, order) => sum + order.totalPoints, 0),
      recentOrder: corporateOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    };
  }).filter(corporate => corporate.orderCount > 0);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Orders by Corporate ({corporateOrderStats.length} companies)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {corporateOrderStats.map(corporate => (
          <div 
            key={corporate.id}
            onClick={() => onSelectCorporate(corporate.id)}
            className="bg-white p-6 rounded-lg border hover:shadow-md cursor-pointer transition-shadow"
          >
            <h4 className="font-semibold text-lg mb-2">{corporate.companyName}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">{corporate.orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Points:</span>
                <span className="font-medium">{corporate.totalPoints}</span>
              </div>
              {corporate.recentOrder && (
                <div className="flex justify-between">
                  <span>Last Order:</span>
                  <span className="font-medium">
                    {new Date(corporate.recentOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 text-blue-600 text-sm font-medium">
              Click to view orders →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Corporate Orders View Component
function CorporateOrdersView({ 
  corporateId, 
  orders, 
  onBack, 
  onViewOrder,
  onUpdateStatus 
}: { 
  corporateId: string, 
  orders: Order[], 
  onBack: () => void,
  onViewOrder: (order: Order) => void,
  onUpdateStatus: (orderId: string, status: string) => void
}) {
  const corporateName = orders[0]?.corporateName || 'Unknown Company';

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Overview
        </button>
        <h3 className="text-lg font-medium">Orders from {corporateName} ({orders.length})</h3>
      </div>
      
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{order.employeeName}</div>
                    <div className="text-xs text-gray-400">{order.employeeEmail}</div>
                  </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onViewOrder(order)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Details
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Order Details View Component
function OrderDetailsView({ 
  order, 
  onBack, 
  onUpdateStatus 
}: { 
  order: Order, 
  onBack: () => void,
  onUpdateStatus: (orderId: string, status: string) => void
}) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Orders
        </button>
        <h3 className="text-lg font-medium">Order Details #{order.id.slice(-8)}</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Order Information</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">#{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Company:</span>
              <span className="font-medium">{order.corporateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employee:</span>
              <div className="text-right">
                <div className="font-medium">{order.employeeName}</div>
                <div className="text-sm text-gray-500">{order.employeeEmail}</div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Points:</span>
              <span className="font-medium">{order.totalPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="text-lg font-medium mb-4">Shipping Address</h4>
            <div className="space-y-2">
              <div className="font-medium">{order.shippingAddress.fullName}</div>
              <div className="text-gray-600">{order.shippingAddress.phone}</div>
              <div className="text-gray-600">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && (
                  <><br />{order.shippingAddress.addressLine2}</>
                )}
              </div>
              <div className="text-gray-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </div>
              <div className="text-gray-600">{order.shippingAddress.country}</div>
            </div>
          </div>
        )}
        
        {/* Products */}
        <div className="bg-white p-6 rounded-lg border lg:col-span-2">
          <h4 className="text-lg font-medium mb-4">Ordered Products</h4>
          <div className="space-y-3">
            {order.products?.map((product: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">Quantity: {product.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{product.pointCost} points each</div>
                  <div className="text-sm text-gray-600">
                    Total: {product.pointCost * product.quantity} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}