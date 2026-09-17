-- RSA SecureShop seed data
-- All accounts and data below are synthetic and for local training only.

-- SECURITY-LAB-VULNERABILITY: V05 - Cryptographic Failure (plaintext password storage)
-- On this branch, passwords are stored in plaintext to demonstrate what an
-- instructor sees after a database breach: `psql` or any DB client shows the
-- real, usable password next to each account, with no hash to crack first.
--   rahul@test.com  -> Rahul123!
--   priya@test.com  -> Priya123!
--   admin@test.com  -> Admin123!
INSERT INTO users (id, name, email, password, role) VALUES
    (101, 'Rahul Sharma', 'rahul@test.com', 'Rahul123!', 'CUSTOMER'),
    (102, 'Priya Patel', 'priya@test.com', 'Priya123!', 'CUSTOMER'),
    (1, 'Site Administrator', 'admin@test.com', 'Admin123!', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 1) FROM users));

INSERT INTO products (id, name, description, category, price, stock, image_url) VALUES
    (1, 'iPhone 15', 'Latest Apple smartphone with A16 chip and dual camera system.', 'Phones', 79999.00, 25, '/images/iphone.svg'),
    (2, 'Dell Laptop 14', '14-inch business laptop, 16GB RAM, 512GB SSD.', 'Computers', 64999.00, 15, '/images/laptop.svg'),
    (3, 'Wireless Headphones', 'Over-ear noise-cancelling wireless headphones.', 'Audio', 4999.00, 60, '/images/headphones.svg'),
    (4, 'Smart Watch Series 5', 'Fitness tracking smart watch with heart-rate monitor.', 'Wearables', 12999.00, 40, '/images/smartwatch.svg'),
    (5, 'Digital Camera X200', '24MP mirrorless digital camera with 18-55mm lens.', 'Cameras', 54999.00, 10, '/images/camera.svg'),
    (6, 'Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches.', 'Accessories', 3499.00, 80, '/images/keyboard.svg'),
    (7, '27" 4K Monitor', '27-inch 4K UHD IPS monitor with HDR support.', 'Computers', 27999.00, 20, '/images/monitor.svg'),
    (8, 'Tablet Pro 11', '11-inch tablet with stylus support, 128GB storage.', 'Tablets', 34999.00, 30, '/images/tablet.svg')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT GREATEST(MAX(id), 1) FROM products));

-- Rahul (101) owns orders 1001 and 1003. Priya (102) owns orders 1002 and 1004.
-- Distinct owners on adjacent, guessable IDs are what make the IDOR lab work.
INSERT INTO orders (id, user_id, status, total_amount, created_at) VALUES
    (1001, 101, 'PAID', 79999.00, NOW() - INTERVAL '10 days'),
    (1002, 102, 'PAID', 64999.00, NOW() - INTERVAL '9 days'),
    (1003, 101, 'PAID', 8498.00, NOW() - INTERVAL '3 days'),
    (1004, 102, 'PAID', 54999.00, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('orders_id_seq', (SELECT GREATEST(MAX(id), 1) FROM orders));

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1001, 1, 1, 79999.00),
    (1002, 2, 1, 64999.00),
    (1003, 3, 1, 4999.00),
    (1003, 6, 1, 3499.00),
    (1004, 5, 1, 54999.00)
ON CONFLICT DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES
    (1, 101, 5, 'Great phone, camera quality is excellent!', NOW() - INTERVAL '8 days'),
    (1, 102, 4, 'Good performance but battery could be better.', NOW() - INTERVAL '6 days'),
    (3, 101, 5, 'Very comfortable and the noise cancellation works well.', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
