import { FormEvent, useEffect, useMemo, useState } from 'react';
import { cancelOrder, createOrder, getOrders, getProducts, loginAdmin, register } from './api';
import AdminPanel from './AdminPanel';
import type { CartItem, Order, Product, User } from './types';

const storedUser = localStorage.getItem('auto-piece-user');
const initialUser = storedUser ? (JSON.parse(storedUser) as User) : null;

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmee',
    cancelled: 'Annulee',
    delivered: 'Livree',
  };
  return labels[status] ?? status;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Freins: '🔴',
  Filtres: '🔲',
  Freinage: '🛞',
  Electricite: '💡',
  Suspension: '🌀',
  Moteur: '⚙️',
  Carrosserie: '🚗',
  Echappement: '💨',
};

function ProductImage({ category, imageUrl }: { category: string; imageUrl?: string }) {
  const bg = 'linear-gradient(135deg,#141414,#1e1e1e)';
  if (imageUrl) {
    return (
      <div className="product-image-inner product-image-photo">
        <img
          src={imageUrl}
          alt={category}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const parent = e.currentTarget.parentElement!;
            parent.style.background = bg;
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.style.fontSize = '3rem';
            parent.textContent = CATEGORY_EMOJI[category] ?? '🔧';
          }}
        />
      </div>
    );
  }
  return (
    <div className="product-image-inner" style={{ background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
      <span>{CATEGORY_EMOJI[category] ?? '🔧'}</span>
    </div>
  );
}

function StarRating({ score = 4.5 }: { score?: number }) {
  const full = Math.floor(score);
  const stars = Array.from({ length: 5 }, (_, i) => i < full);
  return (
    <div className="product-stars">
      {stars.map((filled, i) => (
        <span key={i} className={filled ? 'star' : 'star-empty'}>★</span>
      ))}
      <span className="star-score">{score.toFixed(1)}</span>
    </div>
  );
}

const SUBNAV_CATEGORIES = ['Freins', 'Filtres', 'Electricite', 'Suspension', 'Moteur', 'Freinage'];

export default function App() {
  const [user, setUser] = useState<User | null>(initialUser);
  const [space, setSpace] = useState<'store' | 'admin'>(() =>
    window.location.hash === '#admin' ? 'admin' : 'store',
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
    [products],
  );

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.quantity, 0), [cart]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  useEffect(() => {
    function syncSpace() {
      setSpace(window.location.hash === '#admin' ? 'admin' : 'store');
    }
    window.addEventListener('hashchange', syncSpace);
    window.addEventListener('popstate', syncSpace);
    return () => {
      window.removeEventListener('hashchange', syncSpace);
      window.removeEventListener('popstate', syncSpace);
    };
  }, []);

  useEffect(() => { loadProducts(); }, [search, category]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auto-piece-user', JSON.stringify(user));
      loadOrders(user.accessToken);
      return;
    }
    localStorage.removeItem('auto-piece-user');
    setOrders([]);
  }, [user]);

  useEffect(() => {
    if (notice || error) {
      const t = setTimeout(() => { setNotice(''); setError(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [notice, error]);

  async function loadProducts() {
    try {
      const data = await getProducts(search, category);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les produits');
    }
  }

  async function loadOrders(token: string) {
    try {
      const data = await getOrders(token);
      setOrders(data);
    } catch { }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (authMode === 'register') {
        await register(username, password, email, phone);
        setNotice('Compte créé. Vous pouvez vous connecter.');
        setAuthMode('login');
      } else {
        const loggedUser = await loginAdmin(username, password);
        setUser(loggedUser);
        setNotice(`Bienvenue ${loggedUser.username}`);
        setAuthOpen(false);
      }
      setPassword('');
      setEmail('');
      setPhone('');
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentification impossible');
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: Product) {
    if (product.quantity <= 0) return;
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.quantity) }
            : item,
        );
      }
      return [...items, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateCart(productId: string, delta: number) {
    setCart((items) =>
      items
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((items) => items.filter((item) => item.product.id !== productId));
  }

  async function submitOrder() {
    if (!user) { setAuthOpen(true); setCartOpen(false); return; }
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await createOrder(
        user.accessToken,
        cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
      );
      setCart([]);
      setCartOpen(false);
      setNotice('Commande envoyée avec succès !');
      await loadProducts();
      await loadOrders(user.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commande impossible');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(orderId: string) {
    if (!user) return;
    setLoading(true);
    try {
      await cancelOrder(user.accessToken, orderId);
      setNotice('Commande annulée.');
      await loadProducts();
      await loadOrders(user.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annulation impossible');
    } finally {
      setLoading(false);
    }
  }

  function openAdmin() {
    window.location.hash = 'admin';
    setSpace('admin');
  }

  function openStore() {
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    setSpace('store');
  }

  function logout() {
    setUser(null);
    setCart([]);
    setOrders([]);
  }

  if (space === 'admin') {
    return <AdminPanel user={user} onLogin={setUser} onLogout={logout} onOpenStore={openStore} />;
  }

  const filteredByCategory = category
    ? products.filter((p) => p.category === category)
    : products;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <a className="navbar-logo" href="#" onClick={(e) => { e.preventDefault(); setCategory(''); setSearch(''); }}>
          <div className="logo-badge">AP</div>
          <div className="logo-text">
            <span className="logo-name">Auto Piece Command</span>
            <span className="logo-sub">Premium Futuristic Automotive Parts</span>
          </div>
        </a>

        <div className="navbar-links">
          <button className="active">Accueil</button>
          <button onClick={() => { setCategory(''); setSearch(''); }}>Boutique</button>
          {categories.slice(0, 3).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
          {user && (
            <button onClick={() => document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Compte
            </button>
          )}
        </div>

        <div className="navbar-right">
          <div className="navbar-search">
            <input
              placeholder="Rechercher des pièces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" aria-label="Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {user ? (
            <button className="user-menu-btn" onClick={logout} title="Se déconnecter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {user.username}
            </button>
          ) : (
            <button className="user-menu-btn" onClick={() => setAuthOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Connexion
            </button>
          )}

          <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Panier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge" key={cartCount}>{cartCount}</span>}
          </button>

          {user?.role === 'admin' ? (
            <button className="admin-link-btn" onClick={openAdmin}>Admin dashboard</button>
          ) : (
            <button className="admin-link-btn" onClick={openAdmin}>Admin dashboard</button>
          )}
        </div>
      </nav>

      {/* ── SUB-NAV ── */}
      <div className="subnav">
        <button className={category === '' ? 'active' : ''} onClick={() => setCategory('')}>Tous</button>
        {SUBNAV_CATEGORIES.map((cat) => (
          <button key={cat} className={category === cat ? 'active' : ''} onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-slash" />
        <div className="hero-accent-left" />
        <div className="hero-accent-right" />
        <div className="hero-content">
          <div className="hero-label">Collection Premium 2026</div>
          <h1 className="hero-title">L'Avenir des<br />Pièces Auto<br />Est Ici</h1>
          <p className="hero-sub">Découvrez notre collection premium</p>
          <button className="hero-cta" onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })}>
            Découvrir la boutique
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="hero-dots">
          <div className="hero-dot active" />
          <div className="hero-dot" />
          <div className="hero-dot" />
        </div>
      </div>

      {/* ── BOUTIQUE ── */}
      <div id="boutique" className="boutique-wrap">
        {/* Sidebar */}
        <aside className="boutique-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <span className="sidebar-title">Catégories</span>
              <svg className="sidebar-chevron open" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <div className="filter-list">
              <div className={`filter-item ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
                <div className="filter-checkbox" />
                <span>Toutes les catégories</span>
              </div>
              {categories.map((cat) => (
                <div key={cat} className={`filter-item ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
                  <div className="filter-checkbox" />
                  <span>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">
              <span className="sidebar-title">Disponibilité</span>
            </div>
            <div className="filter-list">
              <div className="filter-item">
                <div className="filter-checkbox" />
                <span>En Stock</span>
              </div>
              <div className="filter-item">
                <div className="filter-checkbox" />
                <span>Stock limité</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-header">
              <span className="sidebar-title">Marques</span>
            </div>
            <div className="filter-list">
              {['BOSCH', 'NGK', 'BREMBO', 'SKF'].map((brand) => (
                <div key={brand} className="filter-item">
                  <div className="filter-checkbox" />
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="boutique-main">
          <div className="boutique-header">
            <div>
              <div className="breadcrumb">
                <span>Accueil</span>
                <span className="sep">›</span>
                <span className="current">Boutique</span>
                {category && (
                  <>
                    <span className="sep">›</span>
                    <span className="current">{category}</span>
                  </>
                )}
              </div>
              <h2 className="boutique-title">{category || 'Boutique'}</h2>
              <div className="boutique-count">{filteredByCategory.length} produit{filteredByCategory.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="filter-bar">
              <button className="filter-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtrer
                {(search || category) && <span className="filter-badge">1</span>}
              </button>
            </div>
          </div>

          {filteredByCategory.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span>Aucun produit trouvé</span>
            </div>
          ) : (
            <div className="product-grid">
              {filteredByCategory.map((product, idx) => {
                const rating = 4.0 + (idx % 5) * 0.2;
                const isLow = product.quantity > 0 && product.quantity < 5;
                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      <ProductImage category={product.category} imageUrl={product.image_url} />
                      <div className="product-quick-view">Aperçu rapide</div>
                      <button className="wishlist-btn" onClick={(e) => e.stopPropagation()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="product-info">
                      <div className="product-brand">AUTO PIECE</div>
                      <div className="product-name">{product.name}</div>
                      <StarRating score={rating} />
                      <div className="product-price-row">
                        <span className="product-price">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                    <div className="product-footer">
                      <span className={`stock-badge${product.quantity === 0 ? ' out' : isLow ? ' low' : ''}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {product.quantity === 0
                          ? 'Rupture de stock'
                          : isLow
                          ? `${product.quantity} restants`
                          : 'En Stock'}
                      </span>
                      <button
                        className="add-to-cart-btn"
                        disabled={product.quantity <= 0}
                        onClick={() => addToCart(product)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Ajouter au panier
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ORDERS SECTION ── */}
      <div id="orders-section" className="orders-section">
        <h2 className="section-heading">
          Mes Commandes
          {user && (
            <button className="refresh-btn" onClick={() => loadOrders(user.accessToken)}>
              Actualiser
            </button>
          )}
        </h2>
        <p className="section-sub">Suivez l'état de vos commandes en temps réel</p>

        {!user && (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span>Connectez-vous pour suivre vos commandes</span>
            <button className="add-to-cart-btn" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setAuthOpen(true)}>
              Se connecter
            </button>
          </div>
        )}

        {user && orders.length === 0 && (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-dim)' }}>
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Aucune commande pour le moment</span>
          </div>
        )}

        {user && orders.length > 0 && (
          <div className="orders-grid">
            {orders.map((order) => (
              <div className="order-row" key={order.id}>
                <span className="order-id">#{order.id}</span>
                <div className="order-meta">
                  <span className="order-items-text">
                    {order.items
                      .map((item) => `${productById.get(item.productId)?.name ?? `Produit #${item.productId}`} ×${item.quantity}`)
                      .join(', ')}
                  </span>
                  <span className="order-date">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('fr-FR')
                      : order.date
                      ? new Date(order.date).toLocaleDateString('fr-FR')
                      : '—'}
                  </span>
                </div>
                <span className={`order-status ${order.status}`}>{statusLabel(order.status)}</span>
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button className="cancel-btn" onClick={() => handleCancel(order.id)} disabled={loading}>
                    Annuler
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer" style={{ marginTop: 'auto' }}>
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-name">AUTO PIECE COMMAND</span>
            <p>La plateforme de référence pour les pièces automobiles premium. Qualité garantie, livraison rapide.</p>
          </div>
          <div className="footer-col">
            <h4>Boutique</h4>
            <ul>
              <li onClick={() => setCategory('')}>Tous les produits</li>
              {categories.map((cat) => <li key={cat} onClick={() => setCategory(cat)}>{cat}</li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Catégorylins</h4>
            <ul>
              <li>Blog</li>
              <li>Compte</li>
              <li>Support</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Newsletter</h4>
            <div className="footer-newsletter">
              <input className="newsletter-input" placeholder="Rechercher newsletter..." />
              <button className="newsletter-btn">→</button>
            </div>
          </div>
        </div>
      </footer>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copy">© 2026 Auto Piece Command. Tous droits réservés.</span>
          <div className="payment-icons">
            {['VISA', 'MC', 'AMEX', 'G Pay'].map((p) => (
              <span key={p} className="payment-icon">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <span className="cart-title">Panier</span>
              <button className="cart-close-btn" onClick={() => setCartOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Votre panier est vide</span>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.product.id}>
                    <div className="cart-item-image">
                      {item.product.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">{formatPrice(item.product.price * item.quantity)}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => updateCart(item.product.id, -1)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateCart(item.product.id, 1)}
                        disabled={item.quantity >= item.product.quantity}
                      >+</button>
                      <button className="remove-btn" onClick={() => removeFromCart(item.product.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-footer">
              <div className="cart-divider" />
              <div className="cart-total">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-value">{formatPrice(cartTotal)}</span>
              </div>
              <select
                className="payment-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Paiement à la livraison</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement bancaire</option>
              </select>
              <button
                className={`checkout-btn${cart.length > 0 ? ' active' : ''}`}
                disabled={loading || cart.length === 0}
                onClick={submitOrder}
              >
                {loading ? 'Traitement...' : 'Valider la commande'}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── AUTH MODAL ── */}
      {authOpen && (
        <div className="modal-overlay" onClick={() => setAuthOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <span className="auth-modal-title">Accès Compte</span>
              <button className="cart-close-btn" onClick={() => setAuthOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="auth-tabs">
              <button className={`auth-tab${authMode === 'login' ? ' active' : ''}`} onClick={() => setAuthMode('login')}>
                Connexion
              </button>
              <button className={`auth-tab${authMode === 'register' ? ' active' : ''}`} onClick={() => setAuthMode('register')}>
                Inscription
              </button>
            </div>
            <form className="auth-form" onSubmit={handleAuth}>
              <div className="form-field">
                <label className="form-label">Nom d'utilisateur</label>
                <input
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_pseudo"
                  required
                  autoComplete="username"
                />
              </div>
              {authMode === 'register' && (
                <>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Téléphone</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      autoComplete="tel"
                    />
                  </div>
                </>
              )}
              <div className="form-field">
                <label className="form-label">Mot de passe</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={4}
                  required
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {error && <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>{error}</div>}
              {notice && <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>{notice}</div>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ── */}
      {(notice || error) && !authOpen && (
        <div className={`toast ${error ? 'error' : 'success'}`}>
          {error ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {error || notice}
        </div>
      )}
    </div>
  );
}
