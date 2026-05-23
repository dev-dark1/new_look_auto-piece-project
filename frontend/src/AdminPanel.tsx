import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  adjustStock,
  createAdminProduct,
  createSupplier,
  deleteAdminProduct,
  deleteSupplier,
  getDashboardStats,
  getProducts,
  getStockMovements,
  getSuppliers,
  loginAdmin,
  updateAdminProduct,
  updateSupplier,
} from './api';
import type { DashboardStats, Product, StockMovement, Supplier, User } from './types';

type AdminPanelProps = {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onOpenStore: () => void;
};

type AdminSection = 'dashboard' | 'products' | 'stock' | 'suppliers' | 'alerts';
type AdminAuthMode = 'login' | 'forgot' | 'reset';
type ThemeMode = 'dark' | 'light';
type SortDirection = 'asc' | 'desc';
type SortKey = 'name' | 'category' | 'price' | 'quantity';
type MediaKind = 'image' | 'video';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  quantity: string;
  supplierId: string;
  category: string;
};

type SupplierForm = {
  name: string;
  contact: string;
};

type StockForm = {
  productId: string;
  type: 'entry' | 'exit';
  quantity: string;
  description: string;
};

type MediaItem = {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  progress: number;
};

type IconName =
  | 'alert'
  | 'bell'
  | 'box'
  | 'chart'
  | 'chevron'
  | 'close'
  | 'dashboard'
  | 'edit'
  | 'eye'
  | 'eyeOff'
  | 'filter'
  | 'image'
  | 'logout'
  | 'menu'
  | 'moon'
  | 'more'
  | 'package'
  | 'plus'
  | 'search'
  | 'settings'
  | 'shield'
  | 'spark'
  | 'stock'
  | 'sun'
  | 'supplier'
  | 'upload'
  | 'user'
  | 'video'
  | 'check';

const LOW_STOCK_LIMIT = 5;
const PAGE_SIZE = 5;
const BRAND_LOGO = '/admin-logo.jpeg';
const BRAND_ICON = '/admin-icon.jpeg';
const BRAND_VECTOR = '/admin-vector.jpeg';

const emptyProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  supplierId: '',
  category: '',
};

const emptySupplierForm: SupplierForm = {
  name: '',
  contact: '',
};

const navItems: { id: AdminSection; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'products', label: 'Produits', icon: 'package' },
  { id: 'stock', label: 'Stock', icon: 'stock' },
  { id: 'suppliers', label: 'Fournisseurs', icon: 'supplier' },
  { id: 'alerts', label: 'Alertes', icon: 'alert' },
];

const colorOptions = ['#d94828', '#0ea5e9', '#111827', '#f8fafc', '#16a34a'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'Universel'];

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function movementLabel(type: string) {
  return type === 'entry' ? 'Entree' : 'Sortie';
}

function stockClass(product: Product) {
  if (product.quantity === 0) return 'stock empty';
  if (product.quantity <= LOW_STOCK_LIMIT) return 'stock critical';
  return 'stock';
}

function productStatus(product: Product) {
  if (product.quantity === 0) return 'Rupture';
  if (product.quantity <= LOW_STOCK_LIMIT) return 'Critique';
  return 'Actif';
}

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const common = {
    className: `admin-icon ${className}`.trim(),
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  const paths: Record<IconName, ReactNode> = {
    alert: (
      <>
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    box: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    dashboard: (
      <>
        <path d="M4 13h7V4H4v9Z" />
        <path d="M13 20h7V4h-7v16Z" />
        <path d="M4 20h7v-5H4v5Z" />
      </>
    ),
    edit: (
      <>
        <path d="m3 17.3 8.5-8.6 3.8 3.8-8.6 8.5L3 21l.1-3.7Z" />
        <path d="m14.5 5.7 1.1-1.1a2.2 2.2 0 1 1 3.1 3.1l-1.1 1.1" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.5 5.4A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.3 4.2" />
        <path d="M6.6 6.7C3.6 8.7 2 12 2 12s3.5 7 10 7c1.5 0 2.8-.3 4-.8" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="m4 15 4-4 3 3 2-2 7 7" />
        <path d="M15 9h.01" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17 15 12l-5-5" />
        <path d="M15 12H3" />
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />,
    more: (
      <>
        <path d="M12 12h.01" />
        <path d="M19 12h.01" />
        <path d="M5 12h.01" />
      </>
    ),
    package: (
      <>
        <path d="M6 7.5 12 4l6 3.5v9L12 20l-6-3.5v-9Z" />
        <path d="M6 8l6 3.5L18 8" />
        <path d="M12 11.5V20" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    search: (
      <>
        <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1A2 2 0 1 1 20 7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.1a2 2 0 0 1 0 4h-.1a1.8 1.8 0 0 0-1.7 1Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </>
    ),
    stock: (
      <>
        <path d="M4 19h16" />
        <path d="M7 16V8" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
      </>
    ),
    sun: (
      <>
        <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="m4.2 4.2 1.4 1.4" />
        <path d="m18.4 18.4 1.4 1.4" />
        <path d="M1 12h2" />
        <path d="M21 12h2" />
        <path d="m4.2 19.8 1.4-1.4" />
        <path d="m18.4 5.6 1.4-1.4" />
      </>
    ),
    supplier: (
      <>
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M9 20v-6h6v6" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      </>
    ),
    user: (
      <>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4.4 4.4L19 7.4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function AdminPanel({ user, onLogin, onLogout, onOpenStore }: AdminPanelProps) {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [authMode, setAuthMode] = useState<AdminAuthMode>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [productStatusValue, setProductStatusValue] = useState('active');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['Universel']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['#d94828']);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm);
  const [stockForm, setStockForm] = useState<StockForm>({
    productId: '',
    type: 'entry',
    quantity: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(() =>
    localStorage.getItem('auto-piece-admin-theme') === 'light' ? 'light' : 'dark',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rowActionLoadingId, setRowActionLoadingId] = useState<string | null>(null);
  const [rowActionSuccessId, setRowActionSuccessId] = useState<string | null>(null);
  const [formSuccessTick, setFormSuccessTick] = useState(0);
  const [formErrorTick, setFormErrorTick] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [tablePage, setTablePage] = useState(1);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [authShake, setAuthShake] = useState(false);
  const productFormCardRef = useRef<HTMLElement | null>(null);
  const supplierFormCardRef = useRef<HTMLElement | null>(null);

  const isAdmin = user?.role === 'admin';
  const token = user?.accessToken ?? '';

  const productById = useMemo(
    () => new Map(allProducts.map((product) => [product.id, product])),
    [allProducts],
  );

  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const productCategories = useMemo(
    () => Array.from(new Set(allProducts.map((product) => product.category))).filter(Boolean),
    [allProducts],
  );

  const criticalProducts = useMemo(
    () => allProducts.filter((product) => product.quantity <= 2),
    [allProducts],
  );

  const lowStockProducts = useMemo(
    () => allProducts.filter((product) => product.quantity > 2 && product.quantity <= LOW_STOCK_LIMIT),
    [allProducts],
  );

  const stockAlertProducts = useMemo(
    () => allProducts.filter((product) => product.quantity <= LOW_STOCK_LIMIT),
    [allProducts],
  );

  const movementHistory = useMemo(() => [...movements].reverse(), [movements]);

  const inventoryTotal = useMemo(
    () => allProducts.reduce((total, product) => total + product.quantity, 0),
    [allProducts],
  );

  const categoryStats = useMemo(() => {
    const totals = new Map<string, number>();
    allProducts.forEach((product) => {
      const category = product.category || 'Sans categorie';
      totals.set(category, (totals.get(category) ?? 0) + product.quantity);
    });

    const max = Math.max(1, ...Array.from(totals.values()));

    return Array.from(totals.entries()).map(([category, total]) => ({
      category,
      total,
      width: Math.max(8, Math.round((total / max) * 100)),
    }));
  }, [allProducts]);

  const selectedProduct = selectedProductId ? productById.get(selectedProductId) : allProducts[0];

  const filteredProducts = useMemo(() => {
    const query = headerSearch.trim().toLowerCase();
    const filtered = query
      ? products.filter((product) =>
          [product.name, product.description, product.category, supplierName(product)]
            .join(' ')
            .toLowerCase()
            .includes(query),
        )
      : products;

    return [...filtered].sort((first, second) => {
      const firstValue = first[sortKey];
      const secondValue = second[sortKey];
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return (firstValue - secondValue) * direction;
      }

      return String(firstValue).localeCompare(String(secondValue)) * direction;
    });
  }, [headerSearch, products, sortDirection, sortKey, suppliers]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE);

  const recentMovements =
    dashboard?.recentMovements && dashboard.recentMovements.length > 0
      ? dashboard.recentMovements
      : movementHistory.slice(0, 5);

  useEffect(() => {
    localStorage.setItem('auto-piece-admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    void loadAdminData();
  }, [isAdmin, token]);

  useEffect(() => {
    if (!isAdmin) return;

    void loadProducts();
  }, [isAdmin, productSearch, productCategory]);

  useEffect(() => {
    setTablePage(1);
  }, [headerSearch, productSearch, productCategory, sortKey, sortDirection]);

  useEffect(() => {
    if (tablePage > pageCount) {
      setTablePage(pageCount);
    }
  }, [pageCount, tablePage]);

  useEffect(() => {
    if (allProducts.length === 0) {
      setSelectedProductId('');
      setStockForm((current) => ({ ...current, productId: '' }));
      return;
    }

    setSelectedProductId((current) =>
      current && allProducts.some((product) => product.id === current) ? current : allProducts[0].id,
    );
    setStockForm((current) =>
      current.productId && allProducts.some((product) => product.id === current.productId)
        ? current
        : { ...current, productId: allProducts[0].id },
    );
  }, [allProducts]);

  async function loadAdminData() {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const [productData, supplierData, movementData, dashboardData] = await Promise.all([
        getProducts(),
        getSuppliers(token),
        getStockMovements(token),
        getDashboardStats(token),
      ]);

      setAllProducts(productData);
      setSuppliers(supplierData);
      setMovements(movementData);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les donnees admin');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const productData = await getProducts(productSearch, productCategory);
      setProducts(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les produits');
    }
  }

  async function refreshAdmin() {
    await loadAdminData();
    await loadProducts();
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

      try {
      if (authMode === 'login') {
        const loggedUser = await loginAdmin(authUsername, authPassword);

        if (loggedUser.role !== 'admin') {
          throw new Error('Acces reserve aux administrateurs');
        }

        onLogin(loggedUser);
        setAuthPassword('');
        setNotice(`Bienvenue ${loggedUser.username}`);
        return;
      }

      if (authMode === 'forgot') {
        setNotice('La route backend de recuperation du mot de passe n est pas disponible.');
        return;
      }

      setResetToken('');
      setNewPassword('');
      setNotice('La route backend de reinitialisation du mot de passe n est pas disponible.');
    } catch (err) {
      setAuthShake(true);
      window.setTimeout(() => setAuthShake(false), 520);
      setError(err instanceof Error ? err.message : 'Authentification admin impossible');
    } finally {
      setLoading(false);
    }
  }

  function updateProductForm(field: keyof ProductForm, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateSupplierForm(field: keyof SupplierForm, value: string) {
    setSupplierForm((current) => ({ ...current, [field]: value }));
  }

  function updateStockForm(field: keyof StockForm, value: string) {
    setStockForm((current) => ({ ...current, [field]: value }));
  }

  function clearMediaItems() {
    mediaItems.forEach((item) => URL.revokeObjectURL(item.url));
    setMediaItems([]);
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductStatusValue('active');
    setSelectedSizes(['Universel']);
    setSelectedColors(['#d94828']);
    clearMediaItems();
  }

  function resetSupplierForm() {
    setEditingSupplierId(null);
    setSupplierForm(emptySupplierForm);
  }

  function getProductPayload() {
    const price = Number(productForm.price);
    const quantity = Number(productForm.quantity);

    if (
      !productForm.name.trim() ||
      !productForm.description.trim() ||
      !productForm.category.trim() ||
      !Number.isFinite(price) ||
      !Number.isFinite(quantity) ||
      price < 0 ||
      quantity < 0
    ) {
      return null;
    }

    return {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price,
      quantity,
      supplierId: productForm.supplierId || undefined,
      category: productForm.category.trim(),
    };
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const editedProductId = editingProductId;

    const payload = getProductPayload();
    if (!payload) {
      setFormErrorTick((n) => n + 1);
      setError('Verifiez le nom, la description, le prix, la quantite et la categorie.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (editingProductId) {
        await updateAdminProduct(token, editingProductId, payload);
        setNotice('Produit modifie avec succes.');
      } else {
        await createAdminProduct(token, payload);
        setNotice('Produit ajoute avec succes.');
      }

      setFormSuccessTick((n) => n + 1);
      if (editedProductId) {
        markRowSuccess(editedProductId);
      }
      resetProductForm();
      await refreshAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement produit impossible');
      setFormErrorTick((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setSelectedProductId(product.id);
    setProductStatusValue(product.quantity === 0 ? 'draft' : 'active');
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      quantity: String(product.quantity),
      supplierId: product.supplierId ?? '',
      category: product.category,
    });
    scrollCardIntoView(productFormCardRef.current);
  }

  async function handleDeleteProduct(product: Product) {
    if (!token || !window.confirm(`Supprimer ${product.name} ?`)) return;

    setLoading(true);
    setError('');
    setNotice('');

    try {
      await deleteAdminProduct(token, product.id);
      setNotice('Produit supprime.');
      await refreshAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression produit impossible');
    } finally {
      setLoading(false);
    }
  }

  async function handleSupplierSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const editedSupplierId = editingSupplierId;

    const payload = {
      name: supplierForm.name.trim(),
      contact: supplierForm.contact.trim(),
    };

    if (!payload.name || !payload.contact) {
      setFormErrorTick((n) => n + 1);
      setError('Verifiez le nom et le contact fournisseur.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (editingSupplierId) {
        await updateSupplier(token, editingSupplierId, payload);
        setNotice('Fournisseur modifie.');
      } else {
        await createSupplier(token, payload);
        setNotice('Fournisseur ajoute.');
      }

      setFormSuccessTick((n) => n + 1);
      if (editedSupplierId) {
        markRowSuccess(editedSupplierId);
      }
      resetSupplierForm();
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement fournisseur impossible');
      setFormErrorTick((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  function startEditSupplier(supplier: Supplier) {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact,
    });
    scrollCardIntoView(supplierFormCardRef.current);
  }

  function handleEditProductRow(event: MouseEvent<HTMLButtonElement>, product: Product) {
    applyButtonRipple(event.currentTarget, event);
    setRowActionLoadingId(product.id);
    startEditProduct(product);
    window.setTimeout(() => {
      setRowActionLoadingId((current) => (current === product.id ? null : current));
    }, 520);
  }

  function handleEditSupplierRow(event: MouseEvent<HTMLButtonElement>, supplier: Supplier) {
    applyButtonRipple(event.currentTarget, event);
    setRowActionLoadingId(supplier.id);
    startEditSupplier(supplier);
    window.setTimeout(() => {
      setRowActionLoadingId((current) => (current === supplier.id ? null : current));
    }, 520);
  }

  async function handleDeleteSupplier(supplier: Supplier) {
    if (!token || !window.confirm(`Supprimer ${supplier.name} ?`)) return;

    setLoading(true);
    setError('');
    setNotice('');

    try {
      await deleteSupplier(token, supplier.id);
      setNotice('Fournisseur supprime.');
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression fournisseur impossible');
    } finally {
      setLoading(false);
    }
  }

  async function handleStockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const quantity = Number(stockForm.quantity);
    if (!stockForm.productId || !Number.isFinite(quantity) || quantity <= 0) {
      setError('Choisissez un produit et une quantite valide.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      await adjustStock(token, {
        productId: stockForm.productId,
        type: stockForm.type,
        quantity,
        description: stockForm.description.trim() || 'Ajustement manuel',
      });

      setNotice(stockForm.type === 'entry' ? 'Entree stock enregistree.' : 'Sortie stock enregistree.');
      setStockForm((current) => ({ ...current, quantity: '', description: '' }));
      await refreshAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ajustement stock impossible');
    } finally {
      setLoading(false);
    }
  }

  function supplierName(product: Product) {
    if (!product.supplierId) return 'Non assigne';
    return supplierById.get(product.supplierId)?.name ?? `Fournisseur ${product.supplierId}`;
  }

  function chooseSection(item: AdminSection) {
    setSection(item);
    setSidebarOpen(false);
  }

  function applyButtonRipple(button: HTMLButtonElement, event: MouseEvent<HTMLButtonElement>) {
    const rect = button.getBoundingClientRect();
    button.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
    button.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
  }

  function scrollCardIntoView(target: HTMLElement | null) {
    window.requestAnimationFrame(() => {
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function markRowSuccess(id: string) {
    setRowActionSuccessId(id);
    window.setTimeout(() => {
      setRowActionSuccessId((current) => (current === id ? null : current));
    }, 1600);
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  function updateSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection('asc');
  }

  function handleMediaInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addMediaFiles(Array.from(event.target.files));
      event.target.value = '';
    }
  }

  function handleMediaDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addMediaFiles(Array.from(event.dataTransfer.files));
  }

  function addMediaFiles(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const nextItems = accepted.map((file) => {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
      const item: MediaItem = {
        id,
        name: file.name,
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(file),
        progress: 12,
      };

      window.setTimeout(() => {
        setMediaItems((current) =>
          current.map((media) => (media.id === id ? { ...media, progress: 58 } : media)),
        );
      }, 180);
      window.setTimeout(() => {
        setMediaItems((current) =>
          current.map((media) => (media.id === id ? { ...media, progress: 100 } : media)),
        );
      }, 520);

      return item;
    });

    setMediaItems((current) => [...current, ...nextItems].slice(0, 8));
  }

  function removeMedia(id: string) {
    setMediaItems((current) => {
      const found = current.find((item) => item.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return current.filter((item) => item.id !== id);
    });
  }

  function toggleSize(size: string) {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size],
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((current) =>
      current.includes(color) ? current.filter((item) => item !== color) : [...current, color],
    );
  }

  function renderToast() {
    if (!notice && !error) return null;

    return (
      <div className={`admin-toast ${error ? 'error' : 'success'}`} role="status">
        <Icon name={error ? 'alert' : 'spark'} />
        <span>{error || notice}</span>
      </div>
    );
  }

  function renderAuthPanel() {
    return (
      <main className={`admin-login-page theme-${theme}`}>
        <div className="login-ambient" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <button className="theme-float-button" type="button" onClick={toggleTheme} aria-label="Changer le theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>

        {renderToast()}

        <section className={`premium-login-card ${authShake ? 'shake' : ''}`}>
          <div className="login-logo-ring">
            <img src={BRAND_ICON} alt="Auto Piece" />
          </div>
          <span className="brand-kicker">Auto Piece Admin</span>
          <h1>Control Center</h1>
          <p className="login-subtitle">Stock, alertes et performance catalogue dans une interface securisee.</p>

          <div className="login-credentials-hint">
            <span className="cred-label">DEMO</span>
            <div className="cred-rows">
              <div className="cred-row">
                <span className="cred-role">Admin</span>
                <code>admin</code>
                <span className="cred-sep">/</span>
                <code>123456</code>
              </div>
              <div className="cred-row">
                <span className="cred-role">User</span>
                <code>flan</code>
                <span className="cred-sep">/</span>
                <code>123456</code>
              </div>
            </div>
          </div>

          {user && user.role !== 'admin' && (
            <section className="message error">Votre role actuel ne permet pas d ouvrir l administration.</section>
          )}

          <div className="auth-mode-switch" role="tablist" aria-label="Mode authentification admin">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Connexion
            </button>
            <button
              className={authMode === 'forgot' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('forgot')}
            >
              Oublie
            </button>
            <button
              className={authMode === 'reset' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('reset')}
            >
              Reset
            </button>
          </div>

          <form className="premium-auth-form" onSubmit={handleAuth}>
            {authMode === 'login' && (
              <>
                <label>
                  Administrateur
                  <input
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
                <label>
                  Mot de passe
                  <span className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      autoComplete="current-password"
                      minLength={4}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Voir le mot de passe">
                      <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                    </button>
                  </span>
                </label>
                <button className="primary-admin-button" type="submit" disabled={loading}>
                  {loading ? <span className="button-loader" /> : <Icon name="shield" />}
                  Se connecter
                </button>
              </>
            )}

            {authMode === 'forgot' && (
              <>
                <label>
                  Utilisateur
                  <input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} required />
                </label>
                <button className="primary-admin-button" type="submit" disabled={loading}>
                  <Icon name="bell" />
                  Envoyer la demande
                </button>
              </>
            )}

            {authMode === 'reset' && (
              <>
                <label>
                  Code
                  <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required />
                </label>
                <label>
                  Nouveau mot de passe
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={4}
                    required
                  />
                </label>
                <button className="primary-admin-button" type="submit" disabled={loading}>
                  <Icon name="settings" />
                  Reinitialiser
                </button>
              </>
            )}
          </form>

          <button className="login-store-link" type="button" onClick={onOpenStore}>
            Retour boutique
          </button>
        </section>
      </main>
    );
  }

  function renderSidebar() {
    return (
      <>
        <button
          className={`admin-drawer-backdrop ${sidebarOpen ? 'visible' : ''}`}
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="premium-sidebar">
          <div className="sidebar-brand">
            <img src={BRAND_ICON} alt="Auto Piece" />
            <div>
              <span>Auto Piece</span>
              <strong>Admin OS</strong>
            </div>
            <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Fermer">
              <Icon name="close" />
            </button>
          </div>

          <nav className="premium-nav" aria-label="Navigation admin">
            {navItems.map((item) => (
              <button
                className={section === item.id ? 'active' : ''}
                data-label={item.label}
                key={item.id}
                type="button"
                onClick={() => chooseSection(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <img src={BRAND_LOGO} alt="Auto Piece" />
            <div>
              <span>Performance parts</span>
              <strong>{inventoryTotal} pieces</strong>
            </div>
          </div>

          <button
            className="sidebar-collapse"
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label="Reduire la navigation"
          >
            <Icon name="chevron" />
          </button>
        </aside>
      </>
    );
  }

  function renderHeader() {
    const sectionLabel = navItems.find((item) => item.id === section)?.label ?? 'Dashboard';

    return (
      <header className="premium-header">
        <div className="header-left">
          <button className="mobile-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Admin</span>
            <Icon name="chevron" />
            <strong>{sectionLabel}</strong>
          </div>
        </div>

        <label className="header-search">
          <Icon name="search" />
          <input
            value={headerSearch}
            onChange={(event) => setHeaderSearch(event.target.value)}
            placeholder="Recherche globale"
          />
        </label>

        <div className="header-actions">
          <div className="live-clock">
            <span>{currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
            <strong>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          <button className="icon-action theme-action" type="button" onClick={toggleTheme} aria-label="Changer theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <div className="dropdown-host">
            <button
              className="icon-action notification-button"
              type="button"
              aria-expanded={notificationOpen}
              onClick={() => {
                setNotificationOpen((current) => !current);
                setProfileOpen(false);
              }}
            >
              <Icon name="bell" />
              {stockAlertProducts.length > 0 && <span>{stockAlertProducts.length}</span>}
            </button>
            {notificationOpen && (
              <div className="premium-dropdown notification-menu">
                <strong>Notifications</strong>
                {stockAlertProducts.slice(0, 4).map((product) => (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => {
                      setSelectedProductId(product.id);
                      chooseSection('alerts');
                      setNotificationOpen(false);
                    }}
                  >
                    <span className={product.quantity <= 2 ? 'critical-dot' : 'warning-dot'} />
                    <div>
                      <b>{product.name}</b>
                      <small>{product.quantity} restant</small>
                    </div>
                  </button>
                ))}
                {stockAlertProducts.length === 0 && <p className="empty-state">Aucune alerte active.</p>}
              </div>
            )}
          </div>
          <div className="dropdown-host">
            <button
              className="profile-button"
              type="button"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationOpen(false);
              }}
            >
              <span>{user?.username.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{user?.username}</strong>
                <small>Administrateur</small>
              </div>
            </button>
            {profileOpen && (
              <div className="premium-dropdown profile-menu">
                <button type="button" onClick={onOpenStore}>
                  <Icon name="box" />
                  Boutique
                </button>
                <button type="button" onClick={onLogout}>
                  <Icon name="logout" />
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  function renderSkeletonCards() {
    return (
      <div className="premium-stat-grid">
        {[1, 2, 3, 4].map((item) => (
          <article className="premium-card stat-card skeleton-card" key={item}>
            <span />
            <strong />
            <small />
          </article>
        ))}
      </div>
    );
  }

  function renderDashboard() {
    if (loading && !dashboard) {
      return (
        <section className="admin-page-section fade-page">
          {renderSkeletonCards()}
        </section>
      );
    }

    return (
      <section className="admin-page-section fade-page">
        <div className="premium-stat-grid">
          <article className="premium-card stat-card accent-red">
            <div className="stat-icon"><Icon name="package" /></div>
            <span>Produits</span>
            <strong>{dashboard?.totalProducts ?? allProducts.length}</strong>
            <small>+12% catalogue</small>
          </article>
          <article className="premium-card stat-card accent-blue">
            <div className="stat-icon"><Icon name="stock" /></div>
            <span>Inventaire</span>
            <strong>{inventoryTotal}</strong>
            <small>Pieces disponibles</small>
          </article>
          <article className="premium-card stat-card accent-steel">
            <div className="stat-icon"><Icon name="chart" /></div>
            <span>Commandes</span>
            <strong>{dashboard?.totalOrders ?? 0}</strong>
            <small>Activite totale</small>
          </article>
          <article className="premium-card stat-card accent-warning">
            <div className="stat-icon"><Icon name="alert" /></div>
            <span>Alertes</span>
            <strong>{stockAlertProducts.length}</strong>
            <small>Stock sous controle</small>
          </article>
        </div>

        <div className="dashboard-hero-grid">
          <section className="premium-card inventory-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Inventory intelligence</span>
                <h2>Stock par categorie</h2>
              </div>
              <button className="ghost-admin-button" type="button" onClick={() => chooseSection('stock')}>
                Stock
              </button>
            </div>
            <div className="premium-chart">
              {categoryStats.map((item) => (
                <div className="premium-chart-row" key={item.category}>
                  <span>{item.category}</span>
                  <div className="premium-track" aria-hidden="true">
                    <i style={{ width: `${item.width}%` }} />
                  </div>
                  <strong>{item.total}</strong>
                </div>
              ))}
              {categoryStats.length === 0 && <p className="empty-state">Aucune donnee stock.</p>}
            </div>
          </section>

          <section className="premium-card brand-spotlight">
            <img src={BRAND_VECTOR} alt="Auto Piece" />
            <div>
              <span>Quality parts</span>
              <h2>Maximum performance</h2>
              <p>{criticalProducts.length} references critiques a traiter maintenant.</p>
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="premium-card" ref={supplierFormCardRef}>
            <div className="section-title">
              <div>
                <span className="section-kicker">Timeline</span>
                <h2>Mouvements recents</h2>
              </div>
              <button className="ghost-admin-button compact-button" type="button" onClick={() => chooseSection('stock')}>
                Voir
              </button>
            </div>
            <div className="activity-timeline">
              {recentMovements.map((movement) => (
                <article className="timeline-item" key={movement.id}>
                  <span className={`timeline-dot ${movement.type}`} />
                  <div>
                    <strong>{productById.get(movement.productId)?.name ?? `Produit ${movement.productId}`}</strong>
                    <small>{movement.description}</small>
                  </div>
                  <b>{movement.quantity}</b>
                </article>
              ))}
              {recentMovements.length === 0 && <p className="empty-state">Aucun mouvement pour le moment.</p>}
            </div>
          </section>

          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Quick actions</span>
                <h2>Command center</h2>
              </div>
            </div>
            <div className="quick-action-grid">
              <button type="button" onClick={() => chooseSection('products')}>
                <Icon name="plus" />
                Ajouter produit
              </button>
              <button type="button" onClick={() => chooseSection('stock')}>
                <Icon name="stock" />
                Mouvement stock
              </button>
              <button type="button" onClick={() => chooseSection('suppliers')}>
                <Icon name="supplier" />
                Fournisseur
              </button>
              <button type="button" onClick={() => chooseSection('alerts')}>
                <Icon name="alert" />
                Alertes
              </button>
            </div>
          </section>

          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Low stock</span>
                <h2>Alertes prioritaires</h2>
              </div>
              <span className="critical-badge">{stockAlertProducts.length}</span>
            </div>
            <div className="alert-list premium-alert-list">
              {stockAlertProducts.slice(0, 5).map((product) => (
                <article className="alert-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                  </div>
                  <span className={product.quantity <= 2 ? 'critical-badge' : 'low-badge'}>
                    {product.quantity}
                  </span>
                </article>
              ))}
              {stockAlertProducts.length === 0 && <p className="empty-state">Aucune alerte active.</p>}
            </div>
          </section>
        </div>
      </section>
    );
  }

  function renderProducts() {
    return (
      <section className="admin-page-section fade-page">
        <section className="premium-card product-command-bar" aria-label="Recherche produits admin">
          <label>
            <Icon name="search" />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Nom ou description"
            />
          </label>
          <label>
            <Icon name="filter" />
            <select value={productCategory} onChange={(event) => setProductCategory(event.target.value)}>
              <option value="">Toutes categories</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost-admin-button" type="button" onClick={() => void refreshAdmin()}>
            Actualiser
          </button>
        </section>

        <div className="product-studio-grid">
          <section className="premium-card product-form-card" ref={productFormCardRef}>
            <div className="section-title">
              <div>
                <span className="section-kicker">Product studio</span>
                <h2>{editingProductId ? 'Modifier produit' : 'Ajouter produit'}</h2>
              </div>
              {editingProductId && (
                <button className="ghost-admin-button compact-button" type="button" onClick={resetProductForm}>
                  Annuler
                </button>
              )}
            </div>
            <form className="premium-form" onSubmit={handleProductSubmit} data-form-success={formSuccessTick} data-form-error={formErrorTick}>
              <label>
                Nom
                <input
                  value={productForm.name}
                  onChange={(event) => updateProductForm('name', event.target.value)}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={productForm.description}
                  onChange={(event) => updateProductForm('description', event.target.value)}
                  rows={3}
                  required
                />
              </label>
              <div className="form-grid">
                <label>
                  Prix
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) => updateProductForm('price', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Quantite
                  <input
                    type="number"
                    min="0"
                    value={productForm.quantity}
                    onChange={(event) => updateProductForm('quantity', event.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Categorie
                  <input
                    value={productForm.category}
                    onChange={(event) => updateProductForm('category', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Fournisseur
                  <select
                    value={productForm.supplierId}
                    onChange={(event) => updateProductForm('supplierId', event.target.value)}
                  >
                    <option value="">Non assigne</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Statut
                <select value={productStatusValue} onChange={(event) => setProductStatusValue(event.target.value)}>
                  <option value="active">Actif</option>
                  <option value="draft">Brouillon</option>
                  <option value="featured">Premium</option>
                </select>
              </label>
              <div className="selector-block">
                <span>Tailles</span>
                <div className="size-selector">
                  {sizeOptions.map((size) => (
                    <button
                      className={selectedSizes.includes(size) ? 'selected' : ''}
                      type="button"
                      key={size}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="selector-block">
                <span>Couleurs</span>
                <div className="color-selector">
                  {colorOptions.map((color) => (
                    <button
                      className={selectedColors.includes(color) ? 'selected' : ''}
                      type="button"
                      key={color}
                      onClick={() => toggleColor(color)}
                      style={{ background: color }}
                      aria-label={`Couleur ${color}`}
                    />
                  ))}
                </div>
              </div>
              <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleMediaDrop}>
                <Icon name="upload" />
                <strong>Glisser medias</strong>
                <span>Images multiples ou courte video</span>
                <input type="file" accept="image/*,video/*" multiple onChange={handleMediaInput} />
              </label>
              <button className="primary-admin-button" type="submit" disabled={loading}>
                {loading ? <span className="button-loader" /> : <Icon name="plus" />}
                {editingProductId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </form>
          </section>

          <aside className="premium-card live-preview-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Live preview</span>
                <h2>Fiche produit</h2>
              </div>
              <span className={`status-badge status-${productStatusValue}`}>{productStatusValue}</span>
            </div>
            <div className="preview-media">
              {mediaItems[0]?.kind === 'image' && <img src={mediaItems[0].url} alt={mediaItems[0].name} />}
              {mediaItems[0]?.kind === 'video' && <video src={mediaItems[0].url} muted controls />}
              {!mediaItems[0] && (
                <div className="preview-placeholder">
                  <Icon name="image" />
                </div>
              )}
            </div>
            <div className="preview-content">
              <span className="category-pill">{productForm.category || 'Categorie'}</span>
              <h2>{productForm.name || selectedProduct?.name || 'Nouveau produit'}</h2>
              <p>{productForm.description || selectedProduct?.description || 'Description produit premium.'}</p>
              <div className="product-meta">
                <strong>{formatPrice(Number(productForm.price) || selectedProduct?.price || 0)}</strong>
                <span className="stock">{productForm.quantity || selectedProduct?.quantity || 0} stock</span>
              </div>
              <div className="mini-swatches">
                {selectedColors.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </div>
            </div>
            <div className="thumbnail-gallery">
              {mediaItems.map((item) => (
                <article key={item.id}>
                  {item.kind === 'image' ? <img src={item.url} alt={item.name} /> : <Icon name="video" />}
                  <div>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <button type="button" onClick={() => removeMedia(item.id)} aria-label={`Retirer ${item.name}`}>
                    <Icon name="close" />
                  </button>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="premium-card table-panel premium-table-panel">
          <div className="section-title">
            <div>
              <span className="section-kicker">Data table</span>
              <h2>Table produits</h2>
            </div>
            <span>{filteredProducts.length} resultats</span>
          </div>
          <div className="table-wrap">
            <table className="admin-table premium-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => updateSort('name')}>Produit</button>
                  </th>
                  <th>
                    <button type="button" onClick={() => updateSort('category')}>Categorie</button>
                  </th>
                  <th>
                    <button type="button" onClick={() => updateSort('price')}>Prix</button>
                  </th>
                  <th>
                    <button type="button" onClick={() => updateSort('quantity')}>Stock</button>
                  </th>
                  <th>Statut</th>
                  <th>Fournisseur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>{product.description}</span>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <span className={stockClass(product)}>{product.quantity}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${product.quantity <= LOW_STOCK_LIMIT ? 'status-draft' : 'status-active'}`}>
                        {productStatus(product)}
                      </span>
                    </td>
                    <td>{supplierName(product)}</td>
                    <td>
                      <div className="table-actions premium-table-actions">
                        <button
                          className="ghost-admin-button compact-button icon-only"
                          type="button"
                          aria-label={`Voir ${product.name}`}
                          data-tooltip="Voir details"
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          <Icon name="eye" />
                        </button>
                        <button
                          className={`ghost-admin-button compact-button action-edit-button ${rowActionSuccessId === product.id ? 'is-success' : ''}`}
                          type="button"
                          title="Modifier"
                          data-action="edit"
                          data-tooltip={rowActionSuccessId === product.id ? 'Produit selectionne' : 'Modifier ce produit'}
                          onClick={(event) => handleEditProductRow(event, product)}
                          disabled={loading && rowActionLoadingId === product.id}
                        >
                          {rowActionLoadingId === product.id ? (
                            <span className="button-loader" />
                          ) : (
                            <>
                              <Icon name={rowActionSuccessId === product.id ? 'check' : 'edit'} />
                              <span>Modifier</span>
                            </>
                          )}
                        </button>
                        <button
                          className="ghost-admin-button compact-button danger icon-only"
                          type="button"
                          aria-label={`Supprimer ${product.name}`}
                          data-tooltip="Supprimer"
                          onClick={() => void handleDeleteProduct(product)}
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedProducts.length === 0 && <p className="empty-state table-empty">Aucun produit trouve.</p>}
          </div>
          <div className="pagination-row">
            <button className="ghost-admin-button compact-button" type="button" disabled={tablePage === 1} onClick={() => setTablePage((page) => page - 1)}>
              Precedent
            </button>
            <span>Page {tablePage} / {pageCount}</span>
            <button className="ghost-admin-button compact-button" type="button" disabled={tablePage === pageCount} onClick={() => setTablePage((page) => page + 1)}>
              Suivant
            </button>
          </div>
        </section>
      </section>
    );
  }

  function renderStock() {
    return (
      <section className="admin-page-section fade-page">
        <div className="dashboard-grid">
          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Stock flow</span>
                <h2>Mouvement stock</h2>
              </div>
              <span className={`movement-badge ${stockForm.type}`}>{stockForm.type === 'entry' ? 'Entree' : 'Sortie'}</span>
            </div>
            <form className="premium-form" onSubmit={handleStockSubmit}>
              <label>
                Produit
                <select
                  value={stockForm.productId}
                  onChange={(event) => updateStockForm('productId', event.target.value)}
                  required
                >
                  {allProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Type
                  <select
                    value={stockForm.type}
                    onChange={(event) => updateStockForm('type', event.target.value as StockForm['type'])}
                  >
                    <option value="entry">Entree stock</option>
                    <option value="exit">Sortie stock</option>
                  </select>
                </label>
                <label>
                  Quantite
                  <input
                    type="number"
                    min="1"
                    value={stockForm.quantity}
                    onChange={(event) => updateStockForm('quantity', event.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Description
                <input
                  value={stockForm.description}
                  onChange={(event) => updateStockForm('description', event.target.value)}
                  placeholder="Ajustement manuel"
                />
              </label>
              <button className="primary-admin-button" type="submit" disabled={loading || allProducts.length === 0}>
                <Icon name="stock" />
                Enregistrer mouvement
              </button>
            </form>
          </section>

          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Resume</span>
                <h2>Inventaire rapide</h2>
              </div>
              <span>{inventoryTotal}</span>
            </div>
            <div className="stock-summary">
              {allProducts.slice(0, 7).map((product) => (
                <article className="stock-summary-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                  </div>
                  <span className={stockClass(product)}>{product.quantity}</span>
                </article>
              ))}
              {allProducts.length === 0 && <p className="empty-state">Aucun produit en stock.</p>}
            </div>
          </section>
        </div>

        <section className="premium-card table-panel premium-table-panel">
          <div className="section-title">
            <div>
              <span className="section-kicker">Historique</span>
              <h2>Mouvements stock</h2>
            </div>
            <span>{movementHistory.length}</span>
          </div>
          <div className="table-wrap">
            <table className="admin-table premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Type</th>
                  <th>Quantite</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {movementHistory.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatDate(movement.date)}</td>
                    <td>{productById.get(movement.productId)?.name ?? `Produit ${movement.productId}`}</td>
                    <td>
                      <span className={`movement-badge ${movement.type}`}>{movementLabel(movement.type)}</span>
                    </td>
                    <td>{movement.quantity}</td>
                    <td>{movement.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movementHistory.length === 0 && <p className="empty-state table-empty">Aucun historique stock.</p>}
          </div>
        </section>
      </section>
    );
  }

  function renderSuppliers() {
    return (
      <section className="admin-page-section fade-page">
        <div className="dashboard-grid">
          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Supply network</span>
                <h2>{editingSupplierId ? 'Modifier fournisseur' : 'Ajouter fournisseur'}</h2>
              </div>
              {editingSupplierId && (
                <button className="ghost-admin-button compact-button" type="button" onClick={resetSupplierForm}>
                  Annuler
                </button>
              )}
            </div>
            <form className="premium-form" onSubmit={handleSupplierSubmit} data-form-success={formSuccessTick} data-form-error={formErrorTick}>
              <label>
                Nom
                <input
                  value={supplierForm.name}
                  onChange={(event) => updateSupplierForm('name', event.target.value)}
                  required
                />
              </label>
              <label>
                Contact
                <input
                  value={supplierForm.contact}
                  onChange={(event) => updateSupplierForm('contact', event.target.value)}
                  required
                />
              </label>
              <button className="primary-admin-button" type="submit" disabled={loading}>
                <Icon name="supplier" />
                {editingSupplierId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </form>
          </section>

          <section className="premium-card">
            <div className="section-title">
              <div>
                <span className="section-kicker">Couverture</span>
                <h2>Performance fournisseurs</h2>
              </div>
              <span>{suppliers.length}</span>
            </div>
            <div className="supplier-mini-list">
              {suppliers.map((supplier) => (
                <article className="supplier-mini-row" key={supplier.id}>
                  <strong>{supplier.name}</strong>
                  <span>{allProducts.filter((product) => product.supplierId === supplier.id).length} produits</span>
                </article>
              ))}
              {suppliers.length === 0 && <p className="empty-state">Aucun fournisseur.</p>}
            </div>
          </section>
        </div>

        <section className="premium-card table-panel premium-table-panel">
          <div className="section-title">
            <div>
              <span className="section-kicker">Data table</span>
              <h2>Fournisseurs</h2>
            </div>
            <span>{suppliers.length}</span>
          </div>
          <div className="table-wrap">
            <table className="admin-table premium-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Contact</th>
                  <th>Produits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td><strong>{supplier.name}</strong></td>
                    <td>{supplier.contact}</td>
                    <td>{allProducts.filter((product) => product.supplierId === supplier.id).length}</td>
                    <td>
                      <div className="table-actions premium-table-actions">
                        <button
                          className={`ghost-admin-button compact-button action-edit-button ${rowActionSuccessId === supplier.id ? 'is-success' : ''}`}
                          type="button"
                          title="Modifier"
                          data-action="edit"
                          data-tooltip={rowActionSuccessId === supplier.id ? 'Fournisseur selectionne' : 'Modifier ce fournisseur'}
                          onClick={(event) => handleEditSupplierRow(event, supplier)}
                          disabled={loading && rowActionLoadingId === supplier.id}
                        >
                          {rowActionLoadingId === supplier.id ? (
                            <span className="button-loader" />
                          ) : (
                            <>
                              <Icon name={rowActionSuccessId === supplier.id ? 'check' : 'edit'} />
                              <span>Modifier</span>
                            </>
                          )}
                        </button>
                        <button
                          className="ghost-admin-button compact-button danger icon-only"
                          type="button"
                          aria-label={`Supprimer ${supplier.name}`}
                          data-tooltip="Supprimer"
                          onClick={() => void handleDeleteSupplier(supplier)}
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && <p className="empty-state table-empty">Aucun fournisseur trouve.</p>}
          </div>
        </section>
      </section>
    );
  }

  function renderAlerts() {
    return (
      <section className="admin-page-section fade-page">
        <div className="premium-stat-grid alert-stat-grid">
          <article className="premium-card stat-card accent-red">
            <div className="stat-icon"><Icon name="alert" /></div>
            <span>Critique</span>
            <strong>{criticalProducts.length}</strong>
            <small>Stock a 2 ou moins</small>
          </article>
          <article className="premium-card stat-card accent-warning">
            <div className="stat-icon"><Icon name="bell" /></div>
            <span>Faible</span>
            <strong>{lowStockProducts.length}</strong>
            <small>Entre 3 et {LOW_STOCK_LIMIT}</small>
          </article>
          <article className="premium-card stat-card accent-blue">
            <div className="stat-icon"><Icon name="shield" /></div>
            <span>OK</span>
            <strong>{allProducts.length - stockAlertProducts.length}</strong>
            <small>Stock suffisant</small>
          </article>
        </div>

        <section className="premium-card">
          <div className="section-title">
            <div>
              <span className="section-kicker">Notifications</span>
              <h2>Alertes stock</h2>
            </div>
            <button className="ghost-admin-button compact-button" type="button" onClick={() => chooseSection('products')}>
              Gerer produits
            </button>
          </div>
          <div className="premium-alert-grid">
            {[...criticalProducts, ...lowStockProducts].map((product) => (
              <article className="premium-alert-card" key={product.id}>
                <div className="alert-card-head">
                  <span className={product.quantity <= 2 ? 'critical-badge' : 'low-badge'}>
                    {product.quantity <= 2 ? 'Critique' : 'Faible'}
                  </span>
                  <Icon name="alert" />
                </div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <div className="product-meta">
                  <strong>{product.quantity} restant</strong>
                  <span>{product.category}</span>
                </div>
                <button
                  className="ghost-admin-button"
                  type="button"
                  onClick={() => {
                    chooseSection('stock');
                    setStockForm((current) => ({ ...current, productId: product.id, type: 'entry' }));
                  }}
                >
                  Reapprovisionner
                </button>
              </article>
            ))}
            {stockAlertProducts.length === 0 && <p className="empty-state">Aucune notification stock.</p>}
          </div>
        </section>
      </section>
    );
  }

  function renderSection() {
    if (section === 'products') return renderProducts();
    if (section === 'stock') return renderStock();
    if (section === 'suppliers') return renderSuppliers();
    if (section === 'alerts') return renderAlerts();
    return renderDashboard();
  }

  if (!isAdmin) {
    return renderAuthPanel();
  }

  return (
    <main className={`admin-app theme-${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {renderToast()}
      {renderSidebar()}
      <section className="admin-main-surface">
        {renderHeader()}
        {renderSection()}
      </section>
    </main>
  );
}
