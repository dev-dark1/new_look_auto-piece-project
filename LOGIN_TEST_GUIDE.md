# 🧪 Login API Testing Guide

## 📋 Prerequisites

1. **MySQL Server Running** on localhost:3306
2. **Node.js Server Running** on port 5000
3. **Test Database Initialized** with test data

---

## ✅ Step 1: Initialize Database

### Option A: Using MySQL Client

```bash
# Open MySQL command line
mysql -u root -p

# Then run:
source c:\Users\pc\Desktop\AutoPiece\auto-piece-project\backend\init_db.sql
```

### Option B: Using MySQL Workbench
1. Open the `init_db.sql` file from `backend/` folder
2. Execute the script
3. Verify: Run `SELECT * FROM users;` (should see 2 users)

---

## 🚀 Step 2: Start the Server

```bash
cd c:\Users\pc\Desktop\AutoPiece\auto-piece-project\backend
npm install  # (if not already done)
node server.js
```

**Expected Output:**
```
◇ injected env (7) from .env
Server is running on port 5000
✓ Database pool connection successful
```

---

## 🔐 Step 3: Test Login API

### Test User Credentials

**User 1:**
- Username: `flan`
- Password: `123456`
- Role: `user`

**User 2 (Admin):**
- Username: `admin`
- Password: `123456`
- Role: `admin`

---

## 📝 Step 4: Postman Testing

### Method 1: Using Postman UI

**Step 1:** Create new request
- URL: `http://localhost:5000/api/auth/login`
- Method: `POST`
- Tab: Body → raw → JSON

**Step 2:** Enter request body
```json
{
  "username": "flan",
  "password": "123456"
}
```

**Step 3:** Send request

**Expected Response (200):**
```json
{
  "id": 1,
  "username": "flan",
  "role": "user",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InVzZXIiLCJpYXQiOjE2NjY0NDAwMDAsImV4cCI6MTY2NjUyNjQwMH0.signature..."
}
```

### Method 2: Using cURL in Terminal

**Test Regular User:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"flan\",\"password\":\"123456\"}"
```

**Test Admin User:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"123456\"}"
```

---

## ✨ Step 5: Save Token for Next Requests

**In Postman:**

1. After successful login, copy the `accessToken` value
2. Click "Environments" (top right)
3. Create/Edit environment variable:
   - Variable name: `token`
   - Value: (paste your token)

4. Use in Authorization header:
   ```
   Authorization: Bearer {{token}}
   ```

---

## 🧪 Test Cases

### Test Case 1: Valid Login
```json
{
  "username": "flan",
  "password": "123456"
}
```
**Expected:** ✅ 200 - Returns user data and token

---

### Test Case 2: Invalid Password
```json
{
  "username": "flan",
  "password": "wrongpassword"
}
```
**Expected:** ❌ 401 - "Invalid password"

---

### Test Case 3: User Not Found
```json
{
  "username": "nonexistent",
  "password": "123456"
}
```
**Expected:** ❌ 404 - "User not found"

---

### Test Case 4: Missing Fields
```json
{
  "username": "flan"
}
```
**Expected:** ❌ 400 - Missing password field error

---

### Test Case 5: Admin Login
```json
{
  "username": "admin",
  "password": "123456"
}
```
**Expected:** ✅ 200 - Returns admin user with role: "admin"

---

## 🔍 Response Analysis

### Success Response (200)
```json
{
  "id": 1,                    // User ID (save for reference)
  "username": "flan",         // Username
  "role": "user",            // User role
  "accessToken": "eyJ..."    // JWT token - USE THIS for next requests
}
```

### Error Response (404)
```json
{
  "message": "User not found"
}
```

### Error Response (401)
```json
{
  "message": "Invalid password"
}
```

---

## 🔐 Token Structure

The returned JWT token contains:
- **Header:** Algorithm (HS256)
- **Payload:** User ID, Role, Expiration (24 hours)
- **Signature:** Encoded hash

**Token Valid For:** 24 hours from login

---

## 📊 Success Checklist

- [ ] Server running on port 5000
- [ ] Database initialized with test users
- [ ] Login with valid credentials returns 200
- [ ] Access token is returned
- [ ] Invalid password returns 401
- [ ] Non-existent user returns 404
- [ ] Admin login works with admin role
- [ ] Regular user login works with user role

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 - Database Error | Check MySQL running, verify autopiece_db exists, check .env credentials |
| 404 - Endpoint not found | Verify endpoint URL: `http://localhost:5000/api/auth/login` |
| Connection refused | Start server with `node server.js` |
| User not found | Run `init_db.sql` to insert test data |
| Wrong password error | Check password is exactly "123456" |

---

## 🚀 Next Steps After Login

Once login is working:

1. **Get All Products:**
   ```
   GET /api/products
   Authorization: Bearer <your_token>
   ```

2. **Create Product (Admin Only):**
   ```
   POST /api/products
   Authorization: Bearer <admin_token>
   ```

3. **Place Order (User):**
   ```
   POST /api/orders
   Authorization: Bearer <user_token>
   ```

See **POSTMAN_API_TESTING.md** for all endpoint examples!

---

**Happy Testing! 🎉**
