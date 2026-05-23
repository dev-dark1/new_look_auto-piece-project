-- Create Database
CREATE DATABASE IF NOT EXISTS autopiece_db;
USE autopiece_db;

-- Create tables
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    quantity INT DEFAULT 0,
    supplierId INT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    status VARCHAR(50) DEFAULT 'pending',
    total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT,
    productId INT,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE TABLE movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productId INT,
    type VARCHAR(50),
    quantity INT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Insert test data - Users (passwords are hashed with bcrypt)
-- User: flan / password: 123456 (pre-hashed)
INSERT INTO users (username, password, role) VALUES 
('flan', '$2a$08$x2xqg6.1gWXLVP5tgEwgYe8jgEyEf7aXPxSLLlwWqYEWx7qvWOY6G', 'user'),
('admin', '$2a$08$x2xqg6.1gWXLVP5tgEwgYe8jgEyEf7aXPxSLLlwWqYEWx7qvWOY6G', 'admin');

-- Insert test suppliers
INSERT INTO suppliers (name, contact) VALUES 
('Auto Distribution Europe', 'supply@ade.example'),
('Garage Parts Nord', 'contact@gpn.example');

-- Insert test products
INSERT INTO products (name, description, price, quantity, supplierId, category) VALUES 
('Filtre a huile Bosch', 'Filtre moteur compatible citadines essence et diesel recentes.', 12.90, 24, 1, 'Filtres'),
('Plaquettes de frein avant', 'Jeu de plaquettes haute resistance pour freinage quotidien.', 38.50, 12, 2, 'Freinage'),
('Batterie 12V 60Ah', 'Batterie sans entretien avec bonne tenue au demarrage a froid.', 96.00, 8, 1, 'Electricite');

-- Test query
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as supplier_count FROM suppliers;
