import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { 
  ShoppingCart, 
  Gift, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building,
  Calendar,
  Package,
  CreditCard,
  Check,
  X,
  Edit,
  Save,
  Plus,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Employee {
  id: string;
  name: string;
  email: string;
  pointsBalance: number;
  department?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
}

interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  countryCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  items: CartItem[];
  totalPoints: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress: ShippingAddress;
  createdAt: any;
}

interface CompanyBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  festivalGreeting?: string;
}

const COUNTRIES = [
  { name: 'United States', code: 'US', phoneCode: '+1' },
  { name: 'United Kingdom', code: 'GB', phoneCode: '+44' },
  { name: 'Canada', code: 'CA', phoneCode: '+1' },
  { name: 'Australia', code: 'AU', phoneCode: '+61' },
  { name: 'Germany', code: 'DE', phoneCode: '+49' },
  { name: 'France', code: 'FR', phoneCode: '+33' },
  { name: 'India', code: 'IN', phoneCode: '+91' },
  { name: 'Japan', code: 'JP', phoneCode: '+81' },
  { name: 'China', code: 'CN', phoneCode: '+86' },
  { name: 'Brazil', code: 'BR', phoneCode: '+55' },
  { name: 'Mexico', code: 'MX', phoneCode: '+52' },
  { name: 'Spain', code: 'ES', phoneCode: '+34' },
  { name: 'Italy', code: 'IT', phoneCode: '+39' },
  { name: 'Netherlands', code: 'NL', phoneCode: '+31' },
  { name: 'Sweden', code: 'SE', phoneCode: '+46' },
  { name: 'Norway', code: 'NO', phoneCode: '+47' },
  { name: 'Denmark', code: 'DK', phoneCode: '+45' },
  { name: 'Finland', code: 'FI', phoneCode: '+358' },
  { name: 'Switzerland', code: 'CH', phoneCode: '+41' },
  { name: 'Austria', code: 'AT', phoneCode: '+43' },
  { name: 'Belgium', code: 'BE', phoneCode: '+32' },
  { name: 'Ireland', code: 'IE', phoneCode: '+353' },
  { name: 'Portugal', code: 'PT', phoneCode: '+351' },
  { name: 'Greece', code: 'GR', phoneCode: '+30' },
  { name: 'Poland', code: 'PL', phoneCode: '+48' },
  { name: 'Czech Republic', code: 'CZ', phoneCode: '+420' },
  { name: 'Hungary', code: 'HU', phoneCode: '+36' },
  { name: 'Romania', code: 'RO', phoneCode: '+40' },
  { name: 'Bulgaria', code: 'BG', phoneCode: '+359' },
  { name: 'Croatia', code: 'HR', phoneCode: '+385' },
  { name: 'Slovenia', code: 'SI', phoneCode: '+386' },
  { name: 'Slovakia', code: 'SK', phoneCode: '+421' },
  { name: 'Estonia', code: 'EE', phoneCode: '+372' },
  { name: 'Latvia', code: 'LV', phoneCode: '+371' },
  { name: 'Lithuania', code: 'LT', phoneCode: '+370' },
  { name: 'Luxembourg', code: 'LU', phoneCode: '+352' },
  { name: 'Malta', code: 'MT', phoneCode: '+356' },
  { name: 'Cyprus', code: 'CY', phoneCode: '+357' },
  { name: 'Iceland', code: 'IS', phoneCode: '+354' },
  { name: 'Russia', code: 'RU', phoneCode: '+7' },
  { name: 'Ukraine', code: 'UA', phoneCode: '+380' },
  { name: 'Belarus', code: 'BY', phoneCode: '+375' },
  { name: 'Moldova', code: 'MD', phoneCode: '+373' },
  { name: 'Georgia', code: 'GE', phoneCode: '+995' },
  { name: 'Armenia', code: 'AM', phoneCode: '+374' },
  { name: 'Azerbaijan', code: 'AZ', phoneCode: '+994' },
  { name: 'Kazakhstan', code: 'KZ', phoneCode: '+7' },
  { name: 'Uzbekistan', code: 'UZ', phoneCode: '+998' },
  { name: 'Turkmenistan', code: 'TM', phoneCode: '+993' },
  { name: 'Kyrgyzstan', code: 'KG', phoneCode: '+996' },
  { name: 'Tajikistan', code: 'TJ', phoneCode: '+992' },
  { name: 'Mongolia', code: 'MN', phoneCode: '+976' },
  { name: 'South Korea', code: 'KR', phoneCode: '+82' },
  { name: 'North Korea', code: 'KP', phoneCode: '+850' },
  { name: 'Taiwan', code: 'TW', phoneCode: '+886' },
  { name: 'Hong Kong', code: 'HK', phoneCode: '+852' },
  { name: 'Macau', code: 'MO', phoneCode: '+853' },
  { name: 'Singapore', code: 'SG', phoneCode: '+65' },
  { name: 'Malaysia', code: 'MY', phoneCode: '+60' },
  { name: 'Thailand', code: 'TH', phoneCode: '+66' },
  { name: 'Vietnam', code: 'VN', phoneCode: '+84' },
  { name: 'Philippines', code: 'PH', phoneCode: '+63' },
  { name: 'Indonesia', code: 'ID', phoneCode: '+62' },
  { name: 'Brunei', code: 'BN', phoneCode: '+673' },
  { name: 'Cambodia', code: 'KH', phoneCode: '+855' },
  { name: 'Laos', code: 'LA', phoneCode: '+856' },
  { name: 'Myanmar', code: 'MM', phoneCode: '+95' },
  { name: 'Bangladesh', code: 'BD', phoneCode: '+880' },
  { name: 'Pakistan', code: 'PK', phoneCode: '+92' },
  { name: 'Afghanistan', code: 'AF', phoneCode: '+93' },
  { name: 'Sri Lanka', code: 'LK', phoneCode: '+94' },
  { name: 'Nepal', code: 'NP', phoneCode: '+977' },
  { name: 'Bhutan', code: 'BT', phoneCode: '+975' },
  { name: 'Maldives', code: 'MV', phoneCode: '+960' },
  { name: 'Iran', code: 'IR', phoneCode: '+98' },
  { name: 'Iraq', code: 'IQ', phoneCode: '+964' },
  { name: 'Turkey', code: 'TR', phoneCode: '+90' },
  { name: 'Syria', code: 'SY', phoneCode: '+963' },
  { name: 'Lebanon', code: 'LB', phoneCode: '+961' },
  { name: 'Jordan', code: 'JO', phoneCode: '+962' },
  { name: 'Israel', code: 'IL', phoneCode: '+972' },
  { name: 'Palestine', code: 'PS', phoneCode: '+970' },
  { name: 'Saudi Arabia', code: 'SA', phoneCode: '+966' },
  { name: 'Kuwait', code: 'KW', phoneCode: '+965' },
  { name: 'Bahrain', code: 'BH', phoneCode: '+973' },
  { name: 'Qatar', code: 'QA', phoneCode: '+974' },
  { name: 'United Arab Emirates', code: 'AE', phoneCode: '+971' },
  { name: 'Oman', code: 'OM', phoneCode: '+968' },
  { name: 'Yemen', code: 'YE', phoneCode: '+967' },
  { name: 'Egypt', code: 'EG', phoneCode: '+20' },
  { name: 'Libya', code: 'LY', phoneCode: '+218' },
  { name: 'Tunisia', code: 'TN', phoneCode: '+216' },
  { name: 'Algeria', code: 'DZ', phoneCode: '+213' },
  { name: 'Morocco', code: 'MA', phoneCode: '+212' },
  { name: 'Sudan', code: 'SD', phoneCode: '+249' },
  { name: 'South Sudan', code: 'SS', phoneCode: '+211' },
  { name: 'Ethiopia', code: 'ET', phoneCode: '+251' },
  { name: 'Eritrea', code: 'ER', phoneCode: '+291' },
  { name: 'Djibouti', code: 'DJ', phoneCode: '+253' },
  { name: 'Somalia', code: 'SO', phoneCode: '+252' },
  { name: 'Kenya', code: 'KE', phoneCode: '+254' },
  { name: 'Uganda', code: 'UG', phoneCode: '+256' },
  { name: 'Tanzania', code: 'TZ', phoneCode: '+255' },
  { name: 'Rwanda', code: 'RW', phoneCode: '+250' },
  { name: 'Burundi', code: 'BI', phoneCode: '+257' },
  { name: 'Democratic Republic of Congo', code: 'CD', phoneCode: '+243' },
  { name: 'Republic of Congo', code: 'CG', phoneCode: '+242' },
  { name: 'Central African Republic', code: 'CF', phoneCode: '+236' },
  { name: 'Chad', code: 'TD', phoneCode: '+235' },
  { name: 'Cameroon', code: 'CM', phoneCode: '+237' },
  { name: 'Equatorial Guinea', code: 'GQ', phoneCode: '+240' },
  { name: 'Gabon', code: 'GA', phoneCode: '+241' },
  { name: 'São Tomé and Príncipe', code: 'ST', phoneCode: '+239' },
  { name: 'Nigeria', code: 'NG', phoneCode: '+234' },
  { name: 'Niger', code: 'NE', phoneCode: '+227' },
  { name: 'Mali', code: 'ML', phoneCode: '+223' },
  { name: 'Burkina Faso', code: 'BF', phoneCode: '+226' },
  { name: 'Ivory Coast', code: 'CI', phoneCode: '+225' },
  { name: 'Ghana', code: 'GH', phoneCode: '+233' },
  { name: 'Togo', code: 'TG', phoneCode: '+228' },
  { name: 'Benin', code: 'BJ', phoneCode: '+229' },
  { name: 'Liberia', code: 'LR', phoneCode: '+231' },
  { name: 'Sierra Leone', code: 'SL', phoneCode: '+232' },
  { name: 'Guinea', code: 'GN', phoneCode: '+224' },
  { name: 'Guinea-Bissau', code: 'GW', phoneCode: '+245' },
  { name: 'Senegal', code: 'SN', phoneCode: '+221' },
  { name: 'Gambia', code: 'GM', phoneCode: '+220' },
  { name: 'Cape Verde', code: 'CV', phoneCode: '+238' },
  { name: 'Mauritania', code: 'MR', phoneCode: '+222' },
  { name: 'Western Sahara', code: 'EH', phoneCode: '+212' },
  { name: 'South Africa', code: 'ZA', phoneCode: '+27' },
  { name: 'Namibia', code: 'NA', phoneCode: '+264' },
  { name: 'Botswana', code: 'BW', phoneCode: '+267' },
  { name: 'Zimbabwe', code: 'ZW', phoneCode: '+263' },
  { name: 'Zambia', code: 'ZM', phoneCode: '+260' },
  { name: 'Malawi', code: 'MW', phoneCode: '+265' },
  { name: 'Mozambique', code: 'MZ', phoneCode: '+258' },
  { name: 'Madagascar', code: 'MG', phoneCode: '+261' },
  { name: 'Mauritius', code: 'MU', phoneCode: '+230' },
  { name: 'Comoros', code: 'KM', phoneCode: '+269' },
  { name: 'Seychelles', code: 'SC', phoneCode: '+248' },
  { name: 'Lesotho', code: 'LS', phoneCode: '+266' },
  { name: 'Eswatini', code: 'SZ', phoneCode: '+268' },
  { name: 'Angola', code: 'AO', phoneCode: '+244' },
  { name: 'Argentina', code: 'AR', phoneCode: '+54' },
  { name: 'Bolivia', code: 'BO', phoneCode: '+591' },
  { name: 'Chile', code: 'CL', phoneCode: '+56' },
  { name: 'Colombia', code: 'CO', phoneCode: '+57' },
  { name: 'Ecuador', code: 'EC', phoneCode: '+593' },
  { name: 'Guyana', code: 'GY', phoneCode: '+592' },
  { name: 'Paraguay', code: 'PY', phoneCode: '+595' },
  { name: 'Peru', code: 'PE', phoneCode: '+51' },
  { name: 'Suriname', code: 'SR', phoneCode: '+597' },
  { name: 'Uruguay', code: 'UY', phoneCode: '+598' },
  { name: 'Venezuela', code: 'VE', phoneCode: '+58' },
  { name: 'French Guiana', code: 'GF', phoneCode: '+594' },
  { name: 'Falkland Islands', code: 'FK', phoneCode: '+500' },
  { name: 'Guatemala', code: 'GT', phoneCode: '+502' },
  { name: 'Belize', code: 'BZ', phoneCode: '+501' },
  { name: 'El Salvador', code: 'SV', phoneCode: '+503' },
  { name: 'Honduras', code: 'HN', phoneCode: '+504' },
  { name: 'Nicaragua', code: 'NI', phoneCode: '+505' },
  { name: 'Costa Rica', code: 'CR', phoneCode: '+506' },
  { name: 'Panama', code: 'PA', phoneCode: '+507' },
  { name: 'Cuba', code: 'CU', phoneCode: '+53' },
  { name: 'Jamaica', code: 'JM', phoneCode: '+1' },
  { name: 'Haiti', code: 'HT', phoneCode: '+509' },
  { name: 'Dominican Republic', code: 'DO', phoneCode: '+1' },
  { name: 'Puerto Rico', code: 'PR', phoneCode: '+1' },
  { name: 'Trinidad and Tobago', code: 'TT', phoneCode: '+1' },
  { name: 'Barbados', code: 'BB', phoneCode: '+1' },
  { name: 'Bahamas', code: 'BS', phoneCode: '+1' },
  { name: 'Antigua and Barbuda', code: 'AG', phoneCode: '+1' },
  { name: 'Saint Kitts and Nevis', code: 'KN', phoneCode: '+1' },
  { name: 'Dominica', code: 'DM', phoneCode: '+1' },
  { name: 'Saint Lucia', code: 'LC', phoneCode: '+1' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', phoneCode: '+1' },
  { name: 'Grenada', code: 'GD', phoneCode: '+1' },
  { name: 'New Zealand', code: 'NZ', phoneCode: '+64' },
  { name: 'Fiji', code: 'FJ', phoneCode: '+679' },
  { name: 'Papua New Guinea', code: 'PG', phoneCode: '+675' },
  { name: 'Solomon Islands', code: 'SB', phoneCode: '+677' },
  { name: 'Vanuatu', code: 'VU', phoneCode: '+678' },
  { name: 'New Caledonia', code: 'NC', phoneCode: '+687' },
  { name: 'French Polynesia', code: 'PF', phoneCode: '+689' },
  { name: 'Samoa', code: 'WS', phoneCode: '+685' },
  { name: 'American Samoa', code: 'AS', phoneCode: '+1' },
  { name: 'Tonga', code: 'TO', phoneCode: '+676' },
  { name: 'Kiribati', code: 'KI', phoneCode: '+686' },
  { name: 'Tuvalu', code: 'TV', phoneCode: '+688' },
  { name: 'Nauru', code: 'NR', phoneCode: '+674' },
  { name: 'Palau', code: 'PW', phoneCode: '+680' },
  { name: 'Marshall Islands', code: 'MH', phoneCode: '+692' },
  { name: 'Micronesia', code: 'FM', phoneCode: '+691' },
  { name: 'Guam', code: 'GU', phoneCode: '+1' },
  { name: 'Northern Mariana Islands', code: 'MP', phoneCode: '+1' }
];

export function CompanySubPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // State management
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [corporateInfo, setCorporateInfo] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  // Cart and checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<'products' | 'cart' | 'orders' | 'profile'>('products');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    countryCode: '+1',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string>('');

  // Detect user's country by IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_name) {
          const country = COUNTRIES.find(c => c.name === data.country_name || c.code === data.country_code);
          if (country) {
            setDetectedCountry(country.name);
            setShippingAddress(prev => ({
              ...prev,
              country: country.name,
              countryCode: country.phoneCode
            }));
          }
        }
      } catch (error) {
        console.log('Could not detect country:', error);
        // Default to US if detection fails
        setShippingAddress(prev => ({
          ...prev,
          country: 'United States',
          countryCode: '+1'
        }));
      }
    };

    detectCountry();
  }, []);

  useEffect(() => {
    if (slug) {
      loadCorporateData();
    }
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && currentEmployee) {
      loadEmployeeData();
    }
  }, [isAuthenticated, currentEmployee]);

  const loadCorporateData = async () => {
    try {
      // Find corporate by slug
      const corporatesQuery = query(
        collection(db, 'users'),
        where('slug', '==', slug),
        where('role', '==', 'corporate')
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
      };
      
      setCorporateInfo(corporateData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading corporate data:', error);
      setError('Failed to load company information');
      setLoading(false);
    }
  };

  const loadProducts = async (corporateId: string) => {
    try {
      // Load selected products for this corporate
      const settingsQuery = query(
        collection(db, 'corporateSettings'),
        where('corporateId', '==', corporateId)
      );
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (!settingsSnapshot.empty) {
        const settings = settingsSnapshot.docs[0].data();
        const selectedProductIds = settings.selectedProducts || [];
        
        if (selectedProductIds.length > 0) {
          const productsSnapshot = await getDocs(collection(db, 'products'));
          const allProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Product));
          
          const filteredProducts = allProducts.filter(product => 
            selectedProductIds.includes(product.id) && product.status === 'active'
          );
          setProducts(filteredProducts);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      // Find employee by email and corporate
      const employeesQuery = query(
        collection(db, 'employees'),
        where('email', '==', loginForm.email),
        where('corporateId', '==', corporateInfo.id)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      
      if (employeesSnapshot.empty) {
        setLoginError('Employee not found or not authorized for this company');
        return;
      }
      
      const employeeData = {
        id: employeesSnapshot.docs[0].id,
        ...employeesSnapshot.docs[0].data()
      };
      
      setCurrentEmployee(employeeData);
      setIsAuthenticated(true);
      setLoginForm({ email: '', password: '' });
      
      // Load products after authentication
      await loadProducts(corporateInfo.id);
      
    } catch (error) {
      console.error('Error during login:', error);
      setLoginError('Login failed. Please try again.');
    }
  };

  const loadEmployeeData = async () => {
    if (!currentEmployee || !corporateInfo) return;
    
    try {
      setEmployeeProfile(currentEmployee);
      
      // Load employee orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('employeeId', '==', currentEmployee.id),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, product }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalPoints = () => {
    return cart.reduce((total, item) => total + (item.product.pointsCost * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!employeeProfile || cart.length === 0) return;

    const totalPoints = getTotalPoints();
    if (totalPoints > employeeProfile.points) {
      alert('Insufficient points balance');
      return;
    }

    try {
      // Create order
      const orderData = {
        employeeId: employeeProfile.id,
        employeeName: employeeProfile.name,
        employeeEmail: employeeProfile.email,
        corporateId: corporateInfo.id,
        items: cart,
        totalPoints,
        status: 'pending' as const,
        shippingAddress,
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Update employee points
      const employeeRef = doc(db, 'employees', employeeProfile.id);
      await updateDoc(employeeRef, {
        points: employeeProfile.points - totalPoints
      });

      // Clear cart and update employee profile
      setCart([]);
      setEmployeeProfile({
        ...employeeProfile,
        points: employeeProfile.points - totalPoints
      });
      setCurrentView('orders');
      
      // Reload employee data
      loadEmployeeData();
      
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    // Address saving logic would go here
    setShowAddressForm(false);
  };

  const handleCountryChange = (countryName: string) => {
    const country = COUNTRIES.find(c => c.name === countryName);
    if (country) {
      setShippingAddress(prev => ({
        ...prev,
        country: country.name,
        countryCode: country.phoneCode
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Corporate Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {corporateInfo.logoUrl && (
                  <img 
                    src={corporateInfo.logoUrl} 
                    alt={`${corporateInfo.companyName} Logo`}
                    className="h-12 w-auto"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {corporateInfo.companyName}
                  </h1>
                  <p className="text-gray-600">Employee Gifting Portal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Employee Login</h2>
            <p className="text-gray-600 text-center mb-6">
              Access your {corporateInfo.companyName} gifting portal
            </p>
            
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleEmployeeLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@company.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank for email-only login"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Access Portal
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Don't have access? Contact your HR department.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {corporateInfo.logoUrl && (
                <img 
                  src={corporateInfo.logoUrl} 
                  alt={`${corporateInfo.companyName} Logo`}
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {corporateInfo.companyName} Store
                </h1>
                <p className="text-gray-600 text-sm">
                  Welcome, {employeeProfile?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Points</p>
                <p className="text-lg font-bold text-blue-600">{employeeProfile?.points || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('products')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gift className="w-4 h-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'cart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Cart ({cart.length})
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Products View */}
        {currentView === 'products' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        {product.pointsCost} points
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                        className={`px-4 py-2 rounded-md ${
                          product.inStock
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cart View */}
        {currentView === 'cart' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-gray-600">
                          {item.product.pointsCost} points each
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.product.pointsCost * item.quantity} points
                        </p>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {getTotalPoints()} points
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={getTotalPoints() > (employeeProfile?.points || 0)}
                    className={`w-full py-3 px-4 rounded-md font-medium ${
                      getTotalPoints() > (employeeProfile?.points || 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {getTotalPoints() > (employeeProfile?.points || 0)
                      ? 'Insufficient Points'
                      : 'Place Order'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders View */}
        {currentView === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-gray-600">
                          {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>{item.product.pointsCost * item.quantity} points</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{order.totalPoints} points</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile View */}
        {currentView === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
            {employeeProfile && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{employeeProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{employeeProfile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Points:</span>
                    <span className="font-medium text-blue-600">{employeeProfile.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{corporateInfo.companyName}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setCurrentEmployee(null);
                        setEmployeeProfile(null);
                        setCart([]);
                        setOrders([]);
                      }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}