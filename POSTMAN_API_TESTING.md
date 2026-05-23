# Auto-Piece API - Postman Testing Guide

## 📌 Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Setup

### 1. Register User
**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "flan",
  "password": "123456",
  "role": "user"
}
```

**Example Response (201):**
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

---

### 2. Login User
**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "flan",
  "password": "123456"
}
```

**Example Response (200):**
```json
{
  "id": 1,
  "username": "flan",
  "role": "user",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**💾 Save Token:** Copy the `accessToken` value to use in other requests.

---

## 🔑 How to Use Token in Postman

For all protected routes, add this header:

**Option 1: Using Authorization Header**
```
Authorization: Bearer <your_token_here>
```

**Option 2: Using x-access-token Header**
```
x-access-token: <your_token_here>
```

---

## 👥 SUPPLIERS ENDPOINTS

### 1. Get All Suppliers
**Endpoint:** `GET /suppliers`

**Headers:**
```
Authorization: Bearer <your_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
[
  {
    "id": 1,
    "name": "Auto Distribution Europe",
    "contact": "supply@ade.example",
    "created_at": "2026-05-21T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Garage Parts Nord",
    "contact": "contact@gpn.example",
    "created_at": "2026-05-21T10:30:00.000Z"
  }
]
```

---

### 2. Create Supplier (Admin Only)
**Endpoint:** `POST /suppliers`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Parts Supplier XYZ",
  "contact": "sales@partssupplier.com"
}
```

**Example Response (201):**
```json
{
  "id": 3,
  "name": "Parts Supplier XYZ",
  "contact": "sales@partssupplier.com"
}
```

---

### 3. Update Supplier (Admin Only)
**Endpoint:** `PUT /suppliers/:id`
Example: `PUT /suppliers/1`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Supplier Name",
  "contact": "newemail@supplier.com"
}
```

**Example Response (200):**
```json
{
  "id": 1,
  "name": "Updated Supplier Name",
  "contact": "newemail@supplier.com"
}
```

---

### 4. Delete Supplier (Admin Only)
**Endpoint:** `DELETE /suppliers/:id`
Example: `DELETE /suppliers/3`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
{
  "message": "Supplier deleted successfully"
}
```

---

## 📦 PRODUCTS ENDPOINTS

### 1. Get All Products
**Endpoint:** `GET /products`

**Headers:**
```
Authorization: Bearer <your_token_here>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `search=keyword` - Search by name or description
- `category=Filtres` - Filter by category

**Examples:**
```
GET /products
GET /products?search=oil
GET /products?category=Filtres
GET /products?search=brake&category=Freinage
```

**Example Response (200):**
```json
[
  {
    "id": 1,
    "name": "Filtre a huile Bosch",
    "description": "Filtre moteur compatible citadines essence et diesel recentes.",
    "price": 12.90,
    "quantity": 24,
    "supplierId": 1,
    "category": "Filtres",
    "created_at": "2026-05-21T10:30:00.000Z"
  }
]
```

---

### 2. Get Single Product
**Endpoint:** `GET /products/:id`
Example: `GET /products/1`

**Headers:**
```
Authorization: Bearer <your_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
{
  "id": 1,
  "name": "Filtre a huile Bosch",
  "description": "Filtre moteur compatible citadines essence et diesel recentes.",
  "price": 12.90,
  "quantity": 24,
  "supplierId": 1,
  "category": "Filtres",
  "created_at": "2026-05-21T10:30:00.000Z"
}
```

---

### 3. Create Product (Admin Only)
**Endpoint:** `POST /products`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Batterie 12V 60Ah",
  "description": "Batterie sans entretien avec bonne tenue au demarrage a froid.",
  "price": 96.00,
  "quantity": 10,
  "supplierId": 1,
  "category": "Electricite"
}
```

**Example Response (201):**
```json
{
  "id": 3,
  "name": "Batterie 12V 60Ah",
  "description": "Batterie sans entretien avec bonne tenue au demarrage a froid.",
  "price": 96.00,
  "quantity": 10,
  "supplierId": 1,
  "category": "Electricite"
}
```

---

### 4. Update Product (Admin Only)
**Endpoint:** `PUT /products/:id`
Example: `PUT /products/1`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Filtre a huile Bosch Premium",
  "price": 14.50,
  "quantity": 20
}
```

**Example Response (200):**
```json
{
  "id": 1,
  "name": "Filtre a huile Bosch Premium",
  "description": "Filtre moteur compatible citadines essence et diesel recentes.",
  "price": 14.50,
  "quantity": 20,
  "supplierId": 1,
  "category": "Filtres"
}
```

---

### 5. Delete Product (Admin Only)
**Endpoint:** `DELETE /products/:id`
Example: `DELETE /products/3`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

## 📋 ORDERS ENDPOINTS

### 1. Place Order (User)
**Endpoint:** `POST /orders`

**Headers:**
```
Authorization: Bearer <user_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "paymentMethod": "credit_card"
}
```

**Example Response (201):**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "paymentMethod": "credit_card",
  "status": "pending",
  "total": 65.70
}
```

---

### 2. Get My Orders (User)
**Endpoint:** `GET /orders`

**Headers:**
```
Authorization: Bearer <user_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "status": "pending",
    "total": 65.70,
    "itemCount": 2,
    "created_at": "2026-05-21T12:00:00.000Z"
  }
]
```

---

### 3. Get All Orders (Admin Only)
**Endpoint:** `GET /orders/all`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "username": "flan",
    "status": "pending",
    "total": 65.70,
    "itemCount": 2,
    "created_at": "2026-05-21T12:00:00.000Z"
  }
]
```

---

### 4. Update Order Status (Admin Only)
**Endpoint:** `PUT /orders/:id/status`
Example: `PUT /orders/1/status`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Status Values:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`

**Example Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "status": "shipped",
  "total": 65.70
}
```

---

### 5. Cancel Order (User)
**Endpoint:** `PUT /orders/:id/cancel`
Example: `PUT /orders/1/cancel`

**Headers:**
```
Authorization: Bearer <user_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "status": "cancelled",
  "total": 65.70
}
```

---

## 📊 STOCK ENDPOINTS

### 1. Get Stock Movements (Admin Only)
**Endpoint:** `GET /stock/movements`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
[
  {
    "id": 1,
    "productId": 1,
    "productName": "Filtre a huile Bosch",
    "type": "exit",
    "quantity": 2,
    "description": "Order #1 placed by user 1",
    "created_at": "2026-05-21T12:00:00.000Z"
  }
]
```

---

### 2. Manual Stock Adjustment (Admin Only)
**Endpoint:** `POST /stock/adjust`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 5,
  "type": "entry",
  "description": "Stock received from supplier"
}
```

**Type Values:** `entry` (add stock), `exit` (remove stock)

**Example Response (201):**
```json
{
  "product": {
    "id": 1,
    "name": "Filtre a huile Bosch",
    "quantity": 27,
    "price": 12.90
  },
  "movement": {
    "id": 2,
    "productId": 1,
    "type": "entry",
    "quantity": 5,
    "description": "Stock received from supplier"
  }
}
```

---

### 3. Get Stock Summary (Admin Only)
**Endpoint:** `GET /stock/summary`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
[
  {
    "id": 1,
    "name": "Filtre a huile Bosch",
    "quantity": 27,
    "category": "Filtres"
  },
  {
    "id": 2,
    "name": "Plaquettes de frein avant",
    "quantity": 11,
    "category": "Freinage"
  }
]
```

---

## 📈 DASHBOARD ENDPOINTS

### Get Dashboard Stats (Admin Only)
**Endpoint:** `GET /dashboard/stats`

**Headers:**
```
Authorization: Bearer <admin_token_here>
Content-Type: application/json
```

**Request Body:** None

**Example Response (200):**
```json
{
  "totalProducts": 3,
  "outOfStock": 0,
  "totalOrders": 1,
  "totalRevenue": 65.70,
  "recentMovements": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Filtre a huile Bosch",
      "type": "exit",
      "quantity": 2,
      "description": "Order #1 placed by user 1",
      "created_at": "2026-05-21T12:00:00.000Z"
    }
  ],
  "lowStockProducts": [
    {
      "id": 2,
      "name": "Plaquettes de frein avant",
      "quantity": 4
    }
  ]
}
```

---

## 🧪 Quick Test Checklist

### Step 1: Create Admin User
- [ ] POST /auth/register with `"role": "admin"` and save token

### Step 2: Create Regular User
- [ ] POST /auth/register with `"role": "user"` and save token

### Step 3: Create Suppliers
- [ ] POST /suppliers with admin token (create 2-3 suppliers)

### Step 4: Create Products
- [ ] POST /products with admin token (create 3-5 products, assign suppliers)

### Step 5: Test Search
- [ ] GET /products?search=keyword
- [ ] GET /products?category=Filtres

### Step 6: Place Orders
- [ ] POST /orders with user token (place 1-2 orders)

### Step 7: Check Stock Movement
- [ ] GET /stock/movements with admin token
- [ ] Verify stock decreased after order

### Step 8: Check Dashboard
- [ ] GET /dashboard/stats with admin token
- [ ] Verify totals are correct

### Step 9: Manual Stock Adjustment
- [ ] POST /stock/adjust with admin token

### Step 10: Cancel Order
- [ ] PUT /orders/:id/cancel with user token
- [ ] Verify stock was restored

---

## ⚠️ Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 403 | "No token provided!" | Add Authorization header |
| 401 | "Unauthorized!" | Token expired or invalid |
| 403 | "Require Admin Role!" | Use admin token for admin endpoints |
| 404 | "Product not found" | Check product ID exists |
| 400 | "Insufficient stock" | Not enough quantity available |
| 400 | "User already exists" | Username taken, try different name |

---

## 💡 Tips for Postman

1. **Save Response as Variable:**
   - In Tests tab: `pm.globals.set("token", pm.response.json().accessToken);`
   - Use in Authorization: `Bearer {{token}}`

2. **Chain Requests:**
   - Login → Save token → Use in product request → etc.

3. **Test Collections:**
   - Create a collection with all requests
   - Set collection-level variables for base URL and token

4. **Environment Setup:**
   - Create environment with variables:
     - `base_url`: http://localhost:5000/api
     - `admin_token`: (set after login)
     - `user_token`: (set after login)

---

**Ready to test! 🚀**
