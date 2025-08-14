import { Blockchain, Transaction } from './blockchain.js';

// Demo data seeder for testing the procurement system
export function seedDemoData(blockchain) {
  console.log('🌱 Seeding demo data...');

  // Sample suppliers
  const suppliers = [
    {
      name: 'ABC Supplies Co.',
      address: '123 Quezon Avenue, Quezon City',
      province: 'Metro Manila',
      contact_person: 'Juan Dela Cruz',
      phone: '+63 2 1234 5678',
      email: 'juan@abcsupplies.ph',
      bir_tin: '123-456-789-000'
    },
    {
      name: 'XYZ Manufacturing Inc.',
      address: '456 Cebu Street, Cebu City',
      province: 'Cebu',
      contact_person: 'Maria Santos',
      phone: '+63 32 9876 5432',
      email: 'maria@xyzmanufacturing.ph',
      bir_tin: '987-654-321-000'
    }
  ];

  // Sample products
  const products = [
    {
      name: 'Office Chairs',
      description: 'Ergonomic office chairs with adjustable height',
      unit: 'pcs',
      unit_price: 2500,
      category: 'Office Furniture'
    },
    {
      name: 'Computer Monitors',
      description: '24-inch LED monitors for office use',
      unit: 'pcs',
      unit_price: 8000,
      category: 'Electronics'
    },
    {
      name: 'Printer Paper',
      description: 'A4 size white printer paper, 80gsm',
      unit: 'reams',
      unit_price: 250,
      category: 'Office Supplies'
    }
  ];

  // Sample orders
  const orders = [
    {
      supplier_id: 1,
      order_id: 'PO-2024-001',
      delivery_address: '789 Ayala Avenue, Makati City',
      notes: 'Urgent delivery needed',
      items: [
        { product_id: 1, quantity: 10, unit_price: 2500 },
        { product_id: 2, quantity: 5, unit_price: 8000 }
      ]
    },
    {
      supplier_id: 2,
      order_id: 'PO-2024-002',
      delivery_address: '321 Bonifacio Street, Taguig City',
      notes: 'Standard delivery',
      items: [
        { product_id: 3, quantity: 20, unit_price: 250 }
      ]
    }
  ];

  // Add suppliers
  suppliers.forEach((supplier, index) => {
    const transaction = new Transaction(
      'system',
      `supplier-${index + 1}`,
      0,
      'supplier_registered',
      supplier
    );
    blockchain.addTransaction(transaction);
    console.log(`✅ Added supplier: ${supplier.name}`);
  });

  // Add products
  products.forEach((product, index) => {
    const transaction = new Transaction(
      'system',
      'inventory',
      0,
      'product_created',
      { ...product, product_id: index + 1 }
    );
    blockchain.addTransaction(transaction);
    console.log(`✅ Added product: ${product.name}`);
  });

  // Add orders
  orders.forEach((order, index) => {
    const totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Create order
    const createTransaction = new Transaction(
      'procurement-dept',
      `supplier-${order.supplier_id}`,
      totalAmount,
      'order_created',
      order
    );
    blockchain.addTransaction(createTransaction);
    console.log(`✅ Added order: ${order.order_id}`);

    // Approve order (simulate approval process)
    const approveTransaction = new Transaction(
      'approver',
      `supplier-${order.supplier_id}`,
      totalAmount,
      'order_approved',
      { ...order, status: 'approved' }
    );
    blockchain.addTransaction(approveTransaction);
    console.log(`✅ Approved order: ${order.order_id}`);
  });

  // Add some inventory adjustments
  const inventoryAdjustments = [
    { product_id: 1, adjustment: 50, product_name: 'Office Chairs', unit: 'pcs', unit_price: 2500 },
    { product_id: 2, adjustment: 25, product_name: 'Computer Monitors', unit: 'pcs', unit_price: 8000 },
    { product_id: 3, adjustment: 100, product_name: 'Printer Paper', unit: 'reams', unit_price: 250 }
  ];

  inventoryAdjustments.forEach((adjustment) => {
    const transaction = new Transaction(
      'inventory-manager',
      'inventory',
      0,
      'inventory_adjusted',
      adjustment
    );
    blockchain.addTransaction(transaction);
    console.log(`✅ Adjusted inventory: ${adjustment.product_name} (${adjustment.adjustment > 0 ? '+' : ''}${adjustment.adjustment})`);
  });

  console.log('🎉 Demo data seeding completed!');
  console.log(`📊 Total transactions added: ${blockchain.pendingTransactions.length}`);
  
  return {
    suppliers: suppliers.length,
    products: products.length,
    orders: orders.length,
    inventoryAdjustments: inventoryAdjustments.length
  };
}

// Test function
if (import.meta.url === `file://${process.argv[1]}`) {
  const blockchain = new Blockchain();
  const stats = seedDemoData(blockchain);
  console.log('\n📈 Seeding Statistics:');
  console.log(`   Suppliers: ${stats.suppliers}`);
  console.log(`   Products: ${stats.products}`);
  console.log(`   Orders: ${stats.orders}`);
  console.log(`   Inventory Adjustments: ${stats.inventoryAdjustments}`);
}
