const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@muncheez.co.ke' },
    update: {},
    create: {
      email: 'admin@muncheez.co.ke',
      passwordHash: adminPassword,
      fullName: 'System Admin',
      phone: '0712345678',
      emailVerified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          roles: 'ADMIN',
          status: 'ACTIVE'
        }
      },
      adminProfile: {
        create: {
          role: 'ADMIN',
          permissions: '{"all": true}'
        }
      }
    }
  });

  console.log('Admin user created:', admin.email);

  // Create sample merchant
  const merchantPassword = await bcrypt.hash('merchant123', 12);
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@muncheez.co.ke' },
    update: {},
    create: {
      email: 'merchant@muncheez.co.ke',
      passwordHash: merchantPassword,
      fullName: 'John Kamau',
      phone: '0712345679',
      emailVerified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          roles: 'CUSTOMER,MERCHANT',
          status: 'ACTIVE'
        }
      },
      merchantProfile: {
        create: {
          businessName: "Kamau's Kitchen",
          type: 'RESTAURANT',
          status: 'APPROVED',
          address: 'Westlands, Nairobi',
          mpesaTill: '882292',
          isActive: true
        }
      }
    }
  });

  console.log('Merchant user created:', merchant.email);

  // Get merchant profile for product creation
  const merchantProfile = await prisma.merchantProfile.findFirst({
    where: { userId: merchant.id }
  });

  // Create store for merchant
  const store = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      merchantId: merchantProfile.id,
      name: "Kamau's Kitchen",
      description: 'Authentic Kenyan cuisine',
      address: 'Westlands, Nairobi',
      lat: -1.2675,
      lng: 36.8108,
      deliveryRadiusKm: 5.0,
      isActive: true,
      isPublic: true,
      deliveryFee: 150
    }
  });

  // Create sample courier
  const courierPassword = await bcrypt.hash('courier123', 12);
  const courier = await prisma.user.upsert({
    where: { email: 'courier@muncheez.co.ke' },
    update: {},
    create: {
      email: 'courier@muncheez.co.ke',
      passwordHash: courierPassword,
      fullName: 'Jane Mwangi',
      phone: '0712345680',
      emailVerified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          roles: 'CUSTOMER,RIDER',
          status: 'ACTIVE'
        }
      },
      riderProfile: {
        create: {
          vehicleType: 'Motorbike',
          vehicleMake: 'Honda',
          vehicleModel: 'CB150R',
          vehiclePlate: 'KDH 882X',
          status: 'APPROVED',
          isOnline: false,
          rating: 4.8
        }
      }
    }
  });

  console.log('Courier user created:', courier.email);

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@muncheez.co.ke' },
    update: {},
    create: {
      email: 'customer@muncheez.co.ke',
      passwordHash: customerPassword,
      fullName: 'Alice Wanjiku',
      phone: '0712345681',
      emailVerified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          roles: 'CUSTOMER',
          status: 'ACTIVE'
        }
      },
      customerProfile: {
        create: {
          loyaltyTier: 'Standard',
          totalOrders: 0,
          totalSpent: 0
        }
      }
    }
  });

  console.log('Customer user created:', customer.email);

  // Create sample products for merchant
  const products = [
    { name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken', price: 850, isAvailable: true, stockLevel: 50 },
    { name: 'Beef Stew', description: 'Slow-cooked beef in rich tomato sauce', price: 650, isAvailable: true, stockLevel: 30 },
    { name: 'Chapati', description: 'Soft, flaky flatbread', price: 50, isAvailable: true, stockLevel: 100 },
    { name: 'Sukuma Wiki', description: 'Fresh collard greens', price: 120, isAvailable: true, stockLevel: 40 },
    { name: 'Mango Juice', description: 'Fresh squeezed mango juice', price: 180, isAvailable: true, stockLevel: 25 }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `product-${product.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `product-${product.name.toLowerCase().replace(/\s/g, '-')}`,
        storeId: store.id,
        merchantId: merchantProfile.id,
        ...product
      }
    });
  }

  console.log('Sample products created');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
