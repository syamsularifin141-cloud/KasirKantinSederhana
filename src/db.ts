import Database from 'better-sqlite3';

const db = new Database('canteen.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    purchase_price REAL NOT NULL, -- Harga kolakan
    selling_price REAL NOT NULL, -- Harga jual
    category TEXT NOT NULL CHECK(category IN ('makanan', 'minuman', 'snack')),
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purchase_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier'
  );
`);

// Seed initial data if products table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (count.count === 0) {
    const insert = db.prepare('INSERT INTO products (name, purchase_price, selling_price, category, image) VALUES (?, ?, ?, ?, ?)');
    const initialProducts = [
        // Makanan
        { name: 'Nasi Goreng', purchase: 12000, selling: 15000, category: 'makanan', image: 'https://picsum.photos/seed/nasigoreng/400/300' },
        { name: 'Mie Ayam', purchase: 9000, selling: 12000, category: 'makanan', image: 'https://picsum.photos/seed/mieayam/400/300' },
        { name: 'Soto Ayam', purchase: 8000, selling: 10000, category: 'makanan', image: 'https://picsum.photos/seed/soto/400/300' },
        { name: 'Bakso', purchase: 9000, selling: 12000, category: 'makanan', image: 'https://picsum.photos/seed/bakso/400/300' },

        // Minuman
        { name: 'Es Teh Manis', purchase: 3000, selling: 5000, category: 'minuman', image: 'https://picsum.photos/seed/esteh/400/300' },
        { name: 'Es Jeruk', purchase: 4000, selling: 6000, category: 'minuman', image: 'https://picsum.photos/seed/esjeruk/400/300' },
        { name: 'Jus Alpukat', purchase: 7000, selling: 10000, category: 'minuman', image: 'https://picsum.photos/seed/jusalpukat/400/300' },

        // Snack
        { name: 'Gorengan', purchase: 1000, selling: 2000, category: 'snack', image: 'https://picsum.photos/seed/gorengan/400/300' },
        { name: 'Keripik Kentang', purchase: 3000, selling: 5000, category: 'snack', image: 'https://picsum.photos/seed/keripik/400/300' },
        { name: 'Roti Bakar', purchase: 5000, selling: 8000, category: 'snack', image: 'https://picsum.photos/seed/rotibakar/400/300' },
    ];

    const insertMany = db.transaction((products) => {
        for (const p of products) insert.run(p.name, p.purchase, p.selling, p.category, p.image);
    });

    insertMany(initialProducts);
    console.log('Initial product data seeded.');
}

export default db;
