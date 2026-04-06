# Brand Services API Documentation

This document outlines the API endpoints for managing brands in the dashboard. All endpoints require JWT authentication via the `Authorization` header.

## Base URL
`/materialmartapi/dashboard/brands` 

## Authentication
All requests must include a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Add Brand
Create a new brand with an optional image upload.

### Method
`POST`

### Path
`/addBrand` or `/add`

### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file` (optional): Image file for the brand
  - `name` (required): String - Brand name
  - `description` (optional): String - Brand description
  - `is_active` (optional): Boolean - Active status (default: true)

### Response
#### Success (200)
```json
{
  "status": true,
  "message": "Brand Added Successfully",
  "data": {
    "id": 1,
    "name": "Brand Name",
    "description": "Brand Description",
    "image_url": "https://materialmart.shop/uploads/brand/1234567890-image.jpg",
    "is_active": 1,
    "created_at": "2026-04-06T12:00:00.000Z"
  }
}
```

#### Error (500)
```json
{
  "status": false,
  "error": "Error details"
}
```

---

## 2. Get All Brands
Retrieve a list of all brands.

### Method
`GET`

### Path
`/allBrands`

### Request
- **Query Parameters**: 
name - (optional for searching)

### Response
#### Success (200)
```json
{
  "status": true,
  "message": "Brands Retrieved Successfully",
  "data": [
    {
      "id": 1,
      "name": "Brand Name",
      "description": "Brand Description",
      "image_url": "https://materialmart.shop/uploads/brand/1234567890-image.jpg",
      "is_active": 1,
      "created_at": "2026-04-06T12:00:00.000Z"
    }
  ]
}
```

#### Error (500)
```json
{
  "status": false,
  "error": "Error details"
}
```

---

## 3. Get Brand by ID
Retrieve a specific brand by its ID.

### Method
`GET`

### Path
`/brandById`

### Request
- **Query Parameters**:
  - `id` (required): Integer - Brand ID

### Response
#### Success (200)
```json
{
  "status": true,
  "message": "Brand Retrieved Successfully",
  "data": {
    "id": 1,
    "name": "Brand Name",
    "description": "Brand Description",
    "image_url": "https://materialmart.shop/uploads/brand/1234567890-image.jpg",
    "is_active": 1,
    "created_at": "2026-04-06T12:00:00.000Z"
  }
}
```

#### Error (500)
```json
{
  "status": false,
  "error": "Error details"
}
```

---

## 4. Edit Brand
Update an existing brand, with optional image replacement.

### Method
`PUT`

### Path
`/edit/:id`

### Request
- **Content-Type**: `multipart/form-data`
- **Path Parameters**:
  - `id` (required): Integer - Brand ID
- **Body**:
  - `file` (optional): New image file (replaces existing image)
  - `name` (optional): String - Updated brand name
  - `description` (optional): String - Updated description
  - `is_active` (optional): Boolean - Updated active status

### Response
#### Success (200)
```json
{
  "success": true,
  "message": "Brand updated"
}
```

#### Error (500)
```json
{
  "success": false,
  "message": "Error updating brand"
}
```

---

## 5. Delete Brand
Delete a brand by its ID.

### Method
`DELETE`

### Path
`/delete/:id`

### Request
- **Path Parameters**:
  - `id` (required): Integer - Brand ID

### Response
#### Success (200)
```json
{
  "success": true,
  "message": "Brand deleted"
}
```

#### Error (500)
```json
{
  "success": false,
  "message": "Error deleting brand"
}
```

---

## Notes
- Image uploads are handled via `multer` and stored in the `uploads/brand/` directory.
- When updating a brand with a new image, the old image file is automatically deleted.
- All timestamps are in ISO 8601 format.
- Boolean values for `is_active` are stored as integers (1 for true, 0 for false) in the database.