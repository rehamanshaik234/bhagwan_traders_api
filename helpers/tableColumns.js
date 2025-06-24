const tableNames = require("./tableNames.js");

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
  title: "title",
  landmark: "landmark",
  city: "city",
  state: "state",
  postalCode: "postal_code",
  longitude: "longitudes",
  latitude: "latitudes",
  houseNnumber: "house_number",
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

const NumberOTPCols = {
  number: "number",
  otp: "otp",
};

function getColumns(tableName) {
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

    case tableNames.numberOtps:
      return NumberOTPCols;

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
        ProductVariantCols,
        NumberOTPCols
      );
  }
}

function getKeyColumn(tableName) {
  const userId = "user_id";
  const addressId = "address_id";
  const brandId = "brand_id";
  const cartItemId = "cart_item_id";
  const cartId = "cart_id";
  const categorId = "category_id";
  const customerId = "customer_id";
  const orderItemId = "order_item_id";
  const productVariantId = "product_variant_id";
  const productId = "product_id";
  const otpNumber = "number";

  switch (tableName) {
    case tableNames.users:
      return userId;

    case tableNames.addresses:
      return addressId;

    case tableNames.brands:
      return brandId;

    case tableNames.cartItems:
      return cartItemId;

    case tableNames.carts:
      return cartId;

    case tableNames.categories:
      return categorId;

    case tableNames.customers:
      return customerId;

    case tableNames.orderItems:
      return orderItemId;

    case tableNames.productVariants:
      return productVariantId;

    case tableNames.products:
      return productId;

    case tableNames.numberOtps:
      return otpNumber;

    default:
      return "id";
  }
}
module.exports = {
  getColumns,
  getKeyColumn,
  NumberOTPCols,
  CustomerCols,
  ProductVariantCols,
  ProductCols,
  OrderItemCols,
  OrderCols,
  CategoryCols,
  CartItemCols,
  CartCols,
  BrandCols,
  AddressCols,
  UserCols,
};
