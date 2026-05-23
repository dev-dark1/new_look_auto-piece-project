DROP DATABASE IF EXISTS autopiece_db;
CREATE DATABASE autopiece_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autopiece_db;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  contact VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX idx_products_category (category),
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  UNIQUE KEY uq_order_product (order_id, product_id)
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  type ENUM('entry', 'exit') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  INDEX idx_stock_movements_product (product_id),
  INDEX idx_stock_movements_created_at (created_at)
) ENGINE=InnoDB;

-- Remplacer ces valeurs par de vrais hashes bcrypt avant de connecter l'API MySQL.
-- Exemple apres installation des dependances backend:
-- node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('admin123',8))"
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', 'replace_with_bcrypt_hash_for_admin123', 'admin'),
  ('client', 'replace_with_bcrypt_hash_for_client123', 'user');

INSERT INTO suppliers (name, contact) VALUES
  ('Auto Distribution Europe', 'supply@ade.example'),
  ('Garage Parts Nord', 'contact@gpn.example');

INSERT INTO products (name, description, price, quantity, supplier_id, category) VALUES
  ('Filtre a huile Bosch', 'Filtre moteur compatible citadines essence et diesel recentes.', 12.90, 24, 1, 'Filtres'),
  ('Plaquettes de frein avant', 'Jeu de plaquettes haute resistance pour freinage quotidien.', 38.50, 12, 2, 'Freinage'),
  ('Batterie 12V 60Ah', 'Batterie sans entretien avec bonne tenue au demarrage a froid.', 96.00, 8, 1, 'Electricite'),
  ('Amortisseur arriere', 'Amortisseur hydraulique pour conduite stable sur route degradee.', 72.75, 6, 2, 'Suspension'),
  ('Bougie allumage iridium', 'Bougie longue duree pour moteur essence performant.', 9.80, 32, 1, 'Moteur'),
  ('Courroie accessoire', 'Courroie striee resistant aux variations de temperature.', 21.40, 0, 2, 'Moteur');

INSERT INTO stock_movements (product_id, type, quantity, description) VALUES
  (1, 'entry', 24, 'Stock initial'),
  (2, 'entry', 12, 'Stock initial'),
  (3, 'entry', 8, 'Stock initial'),
  (4, 'entry', 6, 'Stock initial'),
  (5, 'entry', 32, 'Stock initial'),
  (6, 'entry', 0, 'Stock initial');
