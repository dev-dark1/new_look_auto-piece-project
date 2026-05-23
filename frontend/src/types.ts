export type User = {
  id: string;
  username: string;
  role: string;
  accessToken: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  supplierId?: string;
  category: string;
  image_url?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered' | string;
  date: string;
  created_at?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  type: 'entry' | 'exit' | string;
  quantity: number;
  date: string;
  description: string;
};

export type DashboardStats = {
  totalProducts: number;
  outOfStock: number;
  totalOrders: number;
  recentMovements: StockMovement[];
};
