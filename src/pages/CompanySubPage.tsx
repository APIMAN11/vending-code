import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Gift, ShoppingCart, User, Award, Package, Plus, Minus, MapPin, Phone, Mail } from 'lucide-react';

interface Corporate {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  slug: string;
  status: string;
}

interface Employee {
  id: string;
  email: string;
  name: string;
  points: number;
  corporateId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  stock: number;
  category: string;
  imageUrl: string;
  status: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Branding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  greeting?: string;
  festivalGreeting?: string;
}

export function CompanySubPage() {
  const { slug } = useParams<{ slug: string }>();
  const [corporate, setCorporate] = useState<Corporate | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [branding, setBranding] = useState<Branding>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  useEffect(() => {
    if (slug) {
      loadCompanyData();
    }
  }, [slug]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError('');

      // Find corporate by slug
      const corporatesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'corporate'),
        where('slug', '==', slug)
      );
      const corporatesSnapshot = await getDocs(corporatesQuery);

      if (corporatesSnapshot.empty) {
        setError('Company not found');
        setLoading(false);
        return;
      }

      const corporateData = {
        id: corporatesSnapshot.docs[0].id,
        ...corporatesSnapshot.docs[0].data()
      } as Corporate;

      if (corporateData.status !== 'approved') {
        setError('This company page is not yet available');
        setLoading(false);
        return;
      }

      setCorporate(corporateData);

      // Load branding settings
      const brandingQuery = query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', corporateData.id)
      );
      const brandingSnapshot = await getDocs(brandingQuery);
      
      if (!brandingSnapshot.empty) {
        const settings = brandingSnapshot.docs[0].data();
        setBranding(settings.branding || {});
        
        // Load selected products
        if (settings.selectedProducts && settings.selectedProducts.length > 0) {
          const productsQuery = query(collection(db, 'products'));
          const productsSnapshot = await getDocs(productsQuery);
          const allProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Product));
          
          const selectedProducts = allProducts.filter(product => 
            settings.selectedProducts.includes(product.id) && 
            product.status === 'active' &&
            product.stock > 0
          );
          setProducts(selectedProducts);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading company data:', error);
      setError('Failed to load company information');
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeEmail.trim() || !corporate) return;

    try {
      // Find employee by email and corporate ID
      const employeesQuery = query(
        collection(db, 'employees'),
        where('email', '==', employeeEmail.toLowerCase().trim()),
        where('corporateId', '==', corporate.id)
      );
      const employeesSnapshot = await getDocs(employeesQuery);

      if (employeesSnapshot.empty) {
        setError('Employee not found. Please check your email address.');
        return;
      }

      const employeeData = {
        id: employeesSnapshot.docs[0].id,
        ...employeesSnapshot.docs[0].data()
      } as Employee;

      setEmployee(employeeData);
      setIsLoggedIn(true);
      setError('');
    } catch (error) {
      console.error('Error logging in employee:', error);
      setError('Failed to log in. Please try again.');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const getTotalPoints = () => {
    return cart.reduce((total, item) => total + (item.product.pointCost * item.quantity), 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !corporate) return;

    const totalPoints = getTotalPoints();
    if (totalPoints > employee.points) {
      setError('Insufficient points for this order');
      return;
    }

    try {
      // Create order
      await addDoc(collection(db, 'orders'), {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        corporateId: corporate.id,
        corporateName: corporate.companyName,
        products: cart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          pointCost: item.product.pointCost,
          quantity: item.quantity
        })),
        totalPoints,
        shippingAddress,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Update employee points
      const employeeRef = doc(db, 'employees', employee.id);
      await updateDoc(employeeRef, {
        points: employee.points - totalPoints
      });

      // Update employee state
      setEmployee(prev => prev ? { ...prev, points: prev.points - totalPoints } : null);

      // Clear cart and close checkout
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !corporate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-8">
          <Gift className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <p className="text-gray-600 mb-6">
            The company page you're looking for doesn't exist or is not yet available.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = branding.primaryColor || '#2563eb';
  const secondaryColor = branding.secondaryColor || '#1d4ed8';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: primaryColor + '20' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {branding.logo ? (
                <img src={branding.logo} alt={corporate?.companyName} className="h-12 w-12 object-contain" />
              ) : (
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {corporate?.companyName?.charAt(0) || 'C'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{corporate?.companyName}</h1>
                <p className="text-sm text-gray-600">Employee Gifting Portal</p>
              </div>
            </div>

            {isLoggedIn && employee && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Award className="h-4 w-4 mr-1" style={{ color: primaryColor }} />
                    {employee.points} points
                  </p>
                </div>
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: primaryColor }}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoggedIn ? (
          /* Employee Login */
          <div className="max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <User className="h-12 w-12 mx-auto mb-4" style={{ color: primaryColor }} />
                <h2 className="text-2xl font-bold text-gray-900">
                  {branding.greeting || `Welcome to ${corporate?.companyName}`}
                </h2>
                {branding.festivalGreeting && (
                  <p className="text-lg mt-2" style={{ color: primaryColor }}>
                    {branding.festivalGreeting}
                  </p>
                )}
                <p className="text-gray-600 mt-2">Enter your email to access your gifts</p>
              </div>

              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: primaryColor }}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white py-3 rounded-md hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Access My Gifts
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Product Catalog */
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Gifts</h2>
              <p className="text-gray-600">Choose from our curated selection of gifts</p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-600">
                  Your company hasn't selected any products yet. Please contact your HR team.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg" style={{ color: primaryColor }}>
                          {product.pointCost} points
                        </span>
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.pointCost > employee!.points}
                        className="w-full py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        style={{ 
                          backgroundColor: product.pointCost > employee!.points ? '#9ca3af' : primaryColor 
                        }}
                      >
                        {product.pointCost > employee!.points ? 'Insufficient Points' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.pointCost} points each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.product.pointCost * item.quantity} points</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total: {getTotalPoints()} points</span>
                      <span className="text-sm text-gray-600">
                        Available: {employee?.points} points
                      </span>
                    </div>
                    
                    {getTotalPoints() > (employee?.points || 0) ? (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                        Insufficient points for this order
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full text-white py-3 rounded-md font-medium"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Proceed to Checkout
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Checkout</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total: {getTotalPoints()} points</span>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="flex-1 text-white py-3 rounded-md font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}