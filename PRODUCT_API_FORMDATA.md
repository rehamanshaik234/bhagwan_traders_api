# Product API Documentation - Brand-Specific Images

This document explains the FormData structure and usage for the **addProduct** and **editProduct** APIs with support for brand-specific product images.

---

## Table of Contents
1. [Add Product API](#add-product-api)
2. [Edit Product API](#edit-product-api)
3. [Get Product APIs](#get-product-apis)
4. [Request Examples](#request-examples)
5. [Database Schema Requirements](#database-schema-requirements)
6. [Error Handling](#error-handling)

---

## Add Product API

**Endpoint:** `POST /addProduct`  
**Authentication:** Required (JWT Token)  
**Middleware:** `authenticateToken.validJWTNeeded`, `handleAddProductUpload`

### Description
Creates a new product with support for:
- General product images
- Brand-specific images (one set per brand)
- Product variants
- Brand prices

### FormData Structure

```
name: string (required)
description: string (required)
price: number (required)
stock: number (required)
brand_id: number (required)
category_id: number (required)
sub_category_id: number (optional)
is_active: boolean (optional, default: 1)
product_variants: JSON string (optional)
product_brand_prices: JSON string (required if brands are used)
files: File[] (optional) - General product images, not tied to any brand
brand_images_{brand_id}: File[] (optional) - Brand-specific images for each brand
```

### FormData Fields Details

#### Basic Product Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✓ | Product name |
| `description` | String | ✓ | Product description |
| `price` | Number | ✓ | Product price |
| `stock` | Number | ✓ | Available stock quantity |
| `brand_id` | Number | ✓ | Default brand ID |
| `category_id` | Number | ✓ | Category ID |
| `sub_category_id` | Number | ✗ | Subcategory ID |
| `is_active` | Boolean | ✗ | Product active status (1/0) |

#### Array/Complex Fields
| Field | Type | Required | Format | Description |
|-------|------|----------|--------|-------------|
| `product_variants` | String | ✗ | JSON Array | Product variants |
| `product_brand_prices` | String | ✓* | JSON Array | Brand prices (*required if adding brands) |

#### Image Fields
| Field | Type | Max Count | Description |
|-------|------|-----------|-------------|
| `files` | File[] | 50 | General product images (not brand-specific) |
| `files[]` | File[] | 50 | Alternative field name for general images |
| `brand_images_{brand_id}` | File[] | 50 | Images specific to a brand |

### product_variants Structure
```json
[
  {
    "variant_type_id": 1,
    "variant_value": "Red",
    "sku": "PROD-RED-001"
  },
  {
    "variant_type_id": 2,
    "variant_value": "Medium",
    "sku": "PROD-MED-001"
  }
]
```

### product_brand_prices Structure
```json
[
  {
    "brand_id": 1,
    "price": 150,
    "discount": 10,
    "commission": 5
  },
  {
    "brand_id": 2,
    "price": 160,
    "discount": 8,
    "commission": 6
  }
]
```

### Success Response
```json
{
  "status": true,
  "message": "Product Added Successfully",
  "data": {
    "id": 123,
    "name": "T-Shirt",
    "description": "Premium quality t-shirt",
    "price": 150,
    "stock": 100,
    "brand_id": 1,
    "category_id": 2,
    "image_url": "https://materialmart.shop/uploads/product/1234567890-tshirt.jpg",
    "is_active": 1,
    "created_at": "2026-04-17T10:30:00.000Z",
    "product_variants": [...],
    "product_brand_prices": [...],
    "image_urls": [
      "https://materialmart.shop/uploads/product/1234567890-tshirt.jpg",
      "https://materialmart.shop/uploads/product/1234567891-tshirt-back.jpg"
    ]
  }
}
```

### Error Response
```json
{
  "status": false,
  "error": "Error message details"
}
```

---

## Edit Product API

**Endpoint:** `PUT /editProduct/:id`  
**Authentication:** Required (JWT Token)  
**Middleware:** `authenticateToken.validJWTNeeded`, `handleEditProductUpload`

### Description
Updates an existing product with support for:
- Updating product details
- Adding/removing general images
- Adding/removing brand-specific images
- Adding/removing variants
- Adding/removing brand prices

### FormData Structure

```
name: string (optional)
description: string (optional)
price: number (optional)
stock: number (optional)
brand_id: number (optional)
category_id: number (optional)
sub_category_id: number (optional)
is_active: boolean (optional)
product_variants: JSON string (optional)
product_brand_prices: JSON string (optional)
deleted_variants: JSON string (optional)
deleted_brand_prices: JSON string (optional)
deleted_images: JSON string (optional)
deleted_brand_images: JSON string (optional)
add_images: File[] (optional)
add_images[]: File[] (optional)
files: File[] (optional)
files[]: File[] (optional)
brand_images_{brand_id}: File[] (optional)
```

### FormData Fields Details

#### Product Update Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✗ | Updated product name |
| `description` | String | ✗ | Updated description |
| `price` | Number | ✗ | Updated price |
| `stock` | Number | ✗ | Updated stock |
| `brand_id` | Number | ✗ | Updated brand ID |
| `category_id` | Number | ✗ | Updated category |
| `sub_category_id` | Number | ✗ | Updated subcategory |
| `is_active` | Boolean | ✗ | Updated status |

#### Deletion Fields
| Field | Type | Format | Description |
|-------|------|--------|-------------|
| `deleted_images` | String | JSON Array | URLs of general images to delete |
| `deleted_brand_images` | String | JSON Array | URLs of brand-specific images to delete |
| `deleted_variants` | String | JSON Array | Variant IDs to delete |
| `deleted_brand_prices` | String | JSON Array | Brand price IDs to delete |

#### Addition Fields
| Field | Type | Format | Description |
|-------|------|--------|-------------|
| `product_variants` | String | JSON Array | New variants to add |
| `product_brand_prices` | String | JSON Array | New brand prices to add |

#### Image Fields
| Field | Type | Max Count | Description |
|-------|------|-----------|-------------|
| `add_images` | File[] | 50 | General images to add (alternative field) |
| `add_images[]` | File[] | 50 | General images to add (alternative field) |
| `files` | File[] | 50 | General images to add |
| `files[]` | File[] | 50 | General images to add (alternative) |
| `brand_images_{brand_id}` | File[] | 50 | Brand-specific images to add |

### deleted_images Structure
```json
[
  "https://materialmart.shop/uploads/product/1234567890-tshirt.jpg",
  "https://materialmart.shop/uploads/product/1234567891-tshirt-back.jpg"
]
```

### deleted_brand_images Structure
```json
[
  "https://materialmart.shop/uploads/product/9876543210-brand1-image.jpg",
  "https://materialmart.shop/uploads/product/9876543211-brand2-image.jpg"
]
```

### deleted_variants / deleted_brand_prices Structure
```json
[1, 2, 3]  // Array of IDs to delete
```

### Success Response
```json
{
  "success": true,
  "message": "Product updated successfully",
  "result": 1  // Number of rows affected
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error updating product",
  "error": "Detailed error message"
}
```

---

## Get Product APIs

### Get Product By ID

**Endpoint:** `GET /productById?id={productId}`  
**Authentication:** Required (JWT Token)

#### Response Structure
```json
{
  "status": true,
  "message": "Product Retrieved Successfully",
  "data": {
    "id": 123,
    "name": "Cotton Fabric Roll",
    "description": "Premium quality cotton fabric",
    "price": 1200,
    "stock": 100,
    "brand_id": 1,
    "category_id": 3,
    "sub_category_id": 5,
    "image_url": "https://materialmart.shop/uploads/product/1234567890-main.jpg",
    "is_active": 1,
    "created_at": "2026-04-17T10:30:00.000Z",
    "updated_at": "2026-04-17T11:00:00.000Z",
    "image_urls": [
      "https://materialmart.shop/uploads/product/1234567890-main.jpg",
      "https://materialmart.shop/uploads/product/1234567891-detail.jpg"
    ],
    "product_variants": [
      {
        "id": 1,
        "product_id": 123,
        "variant_type_id": 1,
        "variant_value": "Red",
        "sku": "FABRIC-RED-001"
      },
      {
        "id": 2,
        "product_id": 123,
        "variant_type_id": 2,
        "variant_value": "Large",
        "sku": "FABRIC-LG-001"
      }
    ],
    "product_brand_prices": [
      {
        "id": 10,
        "product_id": 123,
        "brand_id": 1,
        "price": 1200,
        "discount": 5,
        "commission": 10,
        "images": [
          "https://materialmart.shop/uploads/product/9876543210-brand1-img1.jpg",
          "https://materialmart.shop/uploads/product/9876543211-brand1-img2.jpg"
        ]
      },
      {
        "id": 11,
        "product_id": 123,
        "brand_id": 2,
        "price": 1250,
        "discount": 3,
        "commission": 12,
        "images": [
          "https://materialmart.shop/uploads/product/9876543220-brand2-img1.jpg"
        ]
      },
      {
        "id": 12,
        "product_id": 123,
        "brand_id": 3,
        "price": 1300,
        "discount": 8,
        "commission": 15,
        "images": []
      }
    ],
    "sub_category": {
      "id": 5,
      "name": "Fabric Materials",
      "description": "Various fabric materials"
    },
    "category": {
      "id": 3,
      "name": "Textiles",
      "description": "Textile products"
    }
  }
}
```

### Get All Products

**Endpoint:** `GET /getAllProducts?page=1&limit=10&brand_id=1&category_id=2&name=shirt&is_active=1&sort=p.created_at&order=DESC`  
**Authentication:** Required (JWT Token)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 10 | Number of products per page |
| `name` | String | - | Search products by name |
| `brand_id` | Number | - | Filter by brand ID |
| `category_id` | Number | - | Filter by category ID |
| `sub_category_id` | Number | - | Filter by subcategory ID |
| `is_active` | Number | 1 | Filter by active status |
| `sort` | String | p.created_at | Sort field |
| `order` | String | DESC | Sort order (ASC/DESC) |

#### Response Structure
```json
{
  "success": true,
  "status": true,
  "message": "Products Retrieved Successfully",
  "data": [
    {
      "id": 123,
      "name": "Cotton Fabric Roll",
      "description": "Premium quality cotton fabric",
      "price": 1200,
      "stock": 100,
      "brand_id": 1,
      "category_id": 3,
      "sub_category_id": 5,
      "image_url": "https://materialmart.shop/uploads/product/1234567890-main.jpg",
      "is_active": 1,
      "created_at": "2026-04-17T10:30:00.000Z",
      "image_urls": [
        "https://materialmart.shop/uploads/product/1234567890-main.jpg",
        "https://materialmart.shop/uploads/product/1234567891-detail.jpg"
      ],
      "product_variants": [
        {
          "id": 1,
          "product_id": 123,
          "variant_type_id": 1,
          "variant_value": "Red",
          "sku": "FABRIC-RED-001"
        }
      ],
      "product_brand_prices": [
        {
          "id": 10,
          "product_id": 123,
          "brand_id": 1,
          "price": 1200,
          "discount": 5,
          "commission": 10,
          "images": [
            "https://materialmart.shop/uploads/product/9876543210-brand1-img1.jpg",
            "https://materialmart.shop/uploads/product/9876543211-brand1-img2.jpg"
          ]
        },
        {
          "id": 11,
          "product_id": 123,
          "brand_id": 2,
          "price": 1250,
          "discount": 3,
          "commission": 12,
          "images": [
            "https://materialmart.shop/uploads/product/9876543220-brand2-img1.jpg"
          ]
        }
      ],
      "sub_category": {
        "id": 5,
        "name": "Fabric Materials",
        "description": "Various fabric materials"
      },
      "category": {
        "id": 3,
        "name": "Textiles",
        "description": "Textile products"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

### Get Products by SubCategory ID

**Endpoint:** `GET /productsBySubCategoryId?subCategoryId={subCategoryId}`  
**Authentication:** Required (JWT Token)

#### Response Structure
```json
{
  "status": true,
  "message": "Products Retrieved Successfully for Sub Category ID 5",
  "data": [
    {
      "id": 123,
      "name": "Cotton Fabric Roll",
      "description": "Premium quality cotton fabric",
      "price": 1200,
      "stock": 100,
      "brand_id": 1,
      "category_id": 3,
      "sub_category_id": 5,
      "image_url": "https://materialmart.shop/uploads/product/1234567890-main.jpg",
      "is_active": 1,
      "image_urls": [
        "https://materialmart.shop/uploads/product/1234567890-main.jpg",
        "https://materialmart.shop/uploads/product/1234567891-detail.jpg"
      ],
      "product_variants": [...],
      "product_brand_prices": [
        {
          "id": 10,
          "product_id": 123,
          "brand_id": 1,
          "price": 1200,
          "discount": 5,
          "commission": 10,
          "images": [
            "https://materialmart.shop/uploads/product/9876543210-brand1-img1.jpg",
            "https://materialmart.shop/uploads/product/9876543211-brand1-img2.jpg"
          ]
        },
        {
          "id": 11,
          "product_id": 123,
          "brand_id": 2,
          "price": 1250,
          "discount": 3,
          "commission": 12,
          "images": [
            "https://materialmart.shop/uploads/product/9876543220-brand2-img1.jpg"
          ]
        }
      ],
      "sub_category": {
        "id": 5,
        "name": "Fabric Materials"
      },
      "category": {
        "id": 3,
        "name": "Textiles"
      }
    }
  ]
}
```

### Key Points about Brand Images in Responses

1. **images Array**: Each brand price object now includes an `images` array containing all image URLs specific to that brand
2. **Empty Array**: If no brand-specific images exist for a brand, the `images` array will be empty `[]`
3. **General Images**: The top-level `image_urls` array contains only general product images (not tied to any brand)
4. **Brand Image Organization**:
   - General images: `image_urls` array at product level
   - Brand-specific images: `images` array within each `product_brand_prices` object

---

## Request Examples

### Example 1: Add Product with General Images Only

```javascript
// Using Fetch API or Axios
const formData = new FormData();

// Basic product info
formData.append('name', 'T-Shirt Premium');
formData.append('description', 'High quality cotton t-shirt');
formData.append('price', 499);
formData.append('stock', 50);
formData.append('brand_id', 1);
formData.append('category_id', 2);
formData.append('is_active', 1);

// General product images
formData.append('files', fileObject1);  // Main image
formData.append('files', fileObject2);  // Secondary image

const response = await fetch('/api/addProduct', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

### Example 2: Add Product with Brand-Specific Images

```javascript
const formData = new FormData();

// Basic product info
formData.append('name', 'Cotton Fabric');
formData.append('description', 'Premium cotton fabric roll');
formData.append('price', 1200);
formData.append('stock', 100);
formData.append('brand_id', 1);
formData.append('category_id', 3);

// Brand prices for multiple brands
const brandPrices = [
  { brand_id: 1, price: 1200, discount: 5, commission: 10 },
  { brand_id: 2, price: 1250, discount: 3, commission: 12 },
  { brand_id: 3, price: 1300, discount: 8, commission: 15 }
];
formData.append('product_brand_prices', JSON.stringify(brandPrices));

// Brand 1 images
formData.append('brand_images_1', brandImage1File1);
formData.append('brand_images_1', brandImage1File2);

// Brand 2 images
formData.append('brand_images_2', brandImage2File1);
formData.append('brand_images_2', brandImage2File2);

// Brand 3 images
formData.append('brand_images_3', brandImage3File1);

// General product images (optional)
formData.append('files', generalImage1);

const response = await fetch('/api/addProduct', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

### Example 3: Add Product with Variants and Brand Prices

```javascript
const formData = new FormData();

// Basic product info
formData.append('name', 'T-Shirt with Sizes');
formData.append('description', 'Available in multiple sizes and colors');
formData.append('price', 599);
formData.append('stock', 200);
formData.append('brand_id', 1);
formData.append('category_id', 2);

// Product variants
const variants = [
  { variant_type_id: 1, variant_value: 'Red', sku: 'TSHIRT-RED-001' },
  { variant_type_id: 1, variant_value: 'Blue', sku: 'TSHIRT-BLUE-001' },
  { variant_type_id: 2, variant_value: 'Small', sku: 'TSHIRT-SM-001' },
  { variant_type_id: 2, variant_value: 'Large', sku: 'TSHIRT-LG-001' }
];
formData.append('product_variants', JSON.stringify(variants));

// Brand prices
const brandPrices = [
  { brand_id: 1, price: 599, discount: 10, commission: 8 },
  { brand_id: 2, price: 650, discount: 5, commission: 10 }
];
formData.append('product_brand_prices', JSON.stringify(brandPrices));

// Images
formData.append('files', imageFile1);
formData.append('brand_images_1', brandImage1File1);
formData.append('brand_images_2', brandImage2File1);

const response = await fetch('/api/addProduct', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

### Example 4: Edit Product - Remove and Add Images

```javascript
const formData = new FormData();

// Update price
formData.append('price', 699);

// Remove old images
const deletedImages = [
  'https://materialmart.shop/uploads/product/1234567890-old-image.jpg'
];
formData.append('deleted_images', JSON.stringify(deletedImages));

// Remove brand-specific images
const deletedBrandImages = [
  'https://materialmart.shop/uploads/product/9876543210-brand1-old.jpg'
];
formData.append('deleted_brand_images', JSON.stringify(deletedBrandImages));

// Add new general images
formData.append('files', newGeneralImage1);
formData.append('files', newGeneralImage2);

// Add new brand-specific images for brand 1
formData.append('brand_images_1', newBrandImage1);

// Add new brand prices
const newBrandPrices = [
  { brand_id: 5, price: 750, discount: 7, commission: 12 }
];
formData.append('product_brand_prices', JSON.stringify(newBrandPrices));

const response = await fetch('/api/editProduct/123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

### Example 5: Edit Product - Remove Variants and Brand Prices

```javascript
const formData = new FormData();

// Delete specific variants
const deletedVariants = [1, 2, 3];
formData.append('deleted_variants', JSON.stringify(deletedVariants));

// Delete specific brand prices
const deletedBrandPrices = [5, 7];
formData.append('deleted_brand_prices', JSON.stringify(deletedBrandPrices));

// Add new variants
const newVariants = [
  { variant_type_id: 3, variant_value: 'Green', sku: 'TSHIRT-GREEN-001' }
];
formData.append('product_variants', JSON.stringify(newVariants));

const response = await fetch('/api/editProduct/123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

---

## Database Schema Requirements

### Ensure product_images Table Has brand_id Column

The `product_images` table must include a `brand_id` column to store brand associations:

```sql
-- Add the brand_id column if it doesn't exist
ALTER TABLE product_images ADD COLUMN brand_id INT DEFAULT NULL;

-- Create an index for faster queries
CREATE INDEX idx_product_id_brand_id ON product_images(product_id, brand_id);
```

### product_images Table Structure
```sql
CREATE TABLE product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  brand_id INT DEFAULT NULL,  -- NULL for general images, brand_id for brand-specific
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
```

---

## Error Handling

### Common Errors

#### Missing Required Fields
```json
{
  "status": false,
  "error": "Missing required fields: name, price, stock"
}
```

#### Invalid JSON in product_variants or product_brand_prices
```json
{
  "status": false,
  "error": "Invalid JSON format in product_brand_prices"
}
```

#### File Upload Error
```json
{
  "success": false,
  "message": "File upload error - File size exceeds maximum limit"
}
```

#### Database Error
```json
{
  "status": false,
  "error": "Query execution error"
}
```

---

## Important Notes

1. **JWT Token**: Always include a valid JWT token in the `Authorization` header for both endpoints.

2. **Brand ID Naming**: The field name for brand-specific images follows the pattern: `brand_images_{brand_id}` (e.g., `brand_images_1`, `brand_images_2`).

3. **Image Storage**: All images are stored at `https://materialmart.shop/uploads/product/` with a timestamp prefix.

4. **JSON Parsing**: Complex fields like `product_variants`, `product_brand_prices`, and `deleted_*` fields must be passed as JSON strings.

5. **File Count**: Maximum 50 files per field. General images max: 50, Brand-specific images per brand max: 50.

6. **Brand Association**: Brand-specific images are identified by a `brand_id` value in the `product_images` table. General images have `brand_id = NULL`.

7. **Deletion Strategy**:
   - Use `deleted_images` for general product images (where `brand_id IS NULL`)
   - Use `deleted_brand_images` for brand-specific images (where `brand_id IS NOT NULL`)

---

## Testing with cURL

### Add Product Example
```bash
curl -X POST http://localhost:3000/api/addProduct \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=T-Shirt" \
  -F "description=Premium T-Shirt" \
  -F "price=499" \
  -F "stock=50" \
  -F "brand_id=1" \
  -F "category_id=2" \
  -F "product_brand_prices=[{\"brand_id\":1,\"price\":499}]" \
  -F "files=@/path/to/image1.jpg" \
  -F "brand_images_1=@/path/to/brand_image.jpg"
```

### Edit Product Example
```bash
curl -X PUT http://localhost:3000/api/editProduct/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "price=599" \
  -F "deleted_images=[\"https://materialmart.shop/uploads/product/old-image.jpg\"]" \
  -F "files=@/path/to/new_image.jpg"
```
