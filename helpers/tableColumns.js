const tableNames = require("./tableNames.js");
module.exports = {
  getColumns,
  getKeyColumn,
};

function getColumns(tableName) {
  const UserCols = {
    id: "id",
    name: "name",
    email: "email",
    password: "password_hash",
    role: "role",
    createdAt: "created_at",
  };

  const AddressCols = {
    id: "id",
    customerId: "customer_id",
    addressLine: "address_line",
    city: "city",
    state: "state",
    postalCode: "postal_code",
    longitude: "longitudes",
    latitude: "latitudes",
    country: "country",
  };

  const BrandCols = {
    id: "id",
    name: "name",
    description: "description",
    imageUrl: "image_url",
    isActive: "is_active",
    createdAt: "created_at",
  };

  const CartCols = {
    id: "id",
    customerId: "customer_id",
    createdAt: "created_at",
  };

  const CartItemCols = {
    id: "id",
    cartId: "cart_id",
    productId: "product_id",
    quantity: "quantity",
  };

  const CategoryCols = {
    id: "id",
    name: "name",
    imageUrl: "image_url",
    description: "description",
  };

  const CustomerCols = {
    id: "id",
    name: "name",
    email: "email",
    password: "password",
    number: "number",
    createdAt: "created_at",
  };

  const OrderCols = {
    id: "id",
    customerId: "customer_id",
    shippingAddress: "shipping_address",
    totalAmount: "total_amount",
    status: "status",
    createdAt: "created_at",
  };

  const OrderItemCols = {
    id: "id",
    orderId: "order_id",
    productId: "product_id",
    quantity: "quantity",
    price: "price",
  };

  const ProductCols = {
    id: "id",
    name: "name",
    description: "description",
    imageUrl: "image_url",
    brandId: "brand_id",
    categoryId: "category_id",
    price: "price",
    stock: "stock",
    isActive: "is_active",
    createdAt: "created_at",
  };

  const ProductVariantCols = {
    id: "id",
    productId: "product_id",
    variantName: "variant_name",
    additionalPrice: "additional_price",
  };

  switch (tableName) {
    case tableNames.users:
      return UserCols;

    case tableNames.addresses:
      return AddressCols;

    case tableNames.brands:
      return BrandCols;

    case tableNames.carts:
      return CartCols;

    case tableNames.cartItems:
      return CartItemCols;

    case tableNames.categories:
      return CategoryCols;

    case tableNames.customers:
      return CustomerCols;

    case tableNames.orders:
      return OrderCols;

    case tableNames.orderItems:
      return OrderItemCols;

    case tableNames.products:
      return ProductCols;

    case tableNames.productVariants:
      return ProductVariantCols;

    case "":
    default:
      return Object.assign(
        {},
        UserCols,
        AddressCols,
        BrandCols,
        CartCols,
        CartItemCols,
        CategoryCols,
        CustomerCols,
        OrderCols,
        OrderItemCols,
        ProductCols,
        ProductVariantCols
      );
  }
}

function getKeyColumn(tableName) {
  const AppUserKey = "app_user_id";
  const BranchKey = "branch_id";
  const DriverKey = "driver_id";
  const StudentKey = "student_id";
  const VehicleKey = "vehicle_id";
  const VehicleRouteKey = "route_id";
  switch (tableName) {
    case tableNames.Users:
      return AppUserKey;

    case tableNames.Branch:
      return BranchKey;

    case tableNames.Driver:
      return DriverKey;

    case tableNames.Student:
      return StudentKey;

    case tableNames.Vehicle:
      return VehicleKey;

    case tableNames.VehicleRoute:
      return VehicleRouteKey;

    default:
      return "id";
  }
}
