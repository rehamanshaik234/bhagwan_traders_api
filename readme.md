### Listen event : 
"new_order"

### data:
```
{
    "data": {"order_id": 12},
    "message": 'New Order Received',
    "timestamp": "22-07-2025"
}
```

### Dispatch Request Event :
"dispatch_order"

### Request body :
```
{
    "orderId" : 32,
    "status" : "Dispatched"
}
```
### Dispatch Listen event : 
"dispatched_order"

### Response data:

```
{
    "orderId": 32,
    "data": {
        "id": 32,
        "customer_id": 8,
        "delivery_partner_id": null,
        "address_id": 33,
        "status": "Dispatched",
        "total_amount": "69999.00",
        "created_at": "2025-07-26T12:22:55.000Z",
        "customer": {
            "id": 8,
            "name": null,
            "number": "7780519178",
            "fcm_token": "exdCq7EiSJebFG8_G67ae7:APA91bH10Cx-LV0ZmQjnXN-GCIKiMy4P1s4LCdHyDREJjfzuGc1paLRJKMcpGW8SVGdiuV4Rwq4tksr9EOs-2SaKycI3WZ9eXUVGlyr3U9HTJyvmFE_P3Ug"
        },
        "delivery_partner": {
            "id": null,
            "name": null,
            "number": null,
            "fcm_token": null
        },
        "customer_gst": {
            "id": 6,
            "gst_number": "37ALCPC4642H1ZD",
            "shop_name": null,
            "gst_address": null
        },
        "address": {
            "id": 33,
            "address_line": "Gandhi Nagar, Vijayawada, Andhra Pradesh (520003)",
            "city": "Vijayawada",
            "state": "Andhra Pradesh",
            "postal_code": "520003",
            "latitude": 16.517616,
            "longitude": 80.629657,
            "house_number": "1st Floor",
            "building_name": "Bhagwan Traders"
        },
        "order_items": [
            {
                "id": 30,
                "quantity": 1,
                "price": "69999.00",
                "product": {
                    "id": 2,
                    "name": "iPhone 13",
                    "description": "Apple smartphone",
                    "image_url": "https://materialmart.shop/uploads/product/1752582074726-furniture-removebg-preview.png",
                    "price": 69999,
                    "is_active": 1,
                    "stock": 30,
                    "sub_category_id": 10
                }
            }
        ]
    },
    "status": "Dispatched",
    "message": "Order dispatched successfully",
    "timestamp": "2025-07-27T06:16:16.166Z"
}
```


### Order Request Event:
"get_order_details"

### Response:
```
{
    "orderId": 23
}
```


### Order Details Listen event : 
"order_details"

### Response data:

```
{
    "orderId": 32,
    "data": {
        "id": 32,
        "customer_id": 8,
        "delivery_partner_id": null,
        "address_id": 33,
        "status": "Dispatched",
        "total_amount": "69999.00",
        "created_at": "2025-07-26T12:22:55.000Z",
        "longitude": 74.555,
        "latitude": 85.555,
        "customer": {
            "id": 8,
            "name": null,
            "number": "7780519178",
            "fcm_token": "exdCq7EiSJebFG8_G67ae7:APA91bH10Cx-LV0ZmQjnXN-GCIKiMy4P1s4LCdHyDREJjfzuGc1paLRJKMcpGW8SVGdiuV4Rwq4tksr9EOs-2SaKycI3WZ9eXUVGlyr3U9HTJyvmFE_P3Ug"
        },
        "delivery_partner": {
            "id": null,
            "name": null,
            "number": null,
            "fcm_token": null
        },
        "customer_gst": {
            "id": 6,
            "gst_number": "37ALCPC4642H1ZD",
            "shop_name": null,
            "gst_address": null
        },
        "address": {
            "id": 33,
            "address_line": "Gandhi Nagar, Vijayawada, Andhra Pradesh (520003)",
            "city": "Vijayawada",
            "state": "Andhra Pradesh",
            "postal_code": "520003",
            "latitude": 16.517616,
            "longitude": 80.629657,
            "house_number": "1st Floor",
            "building_name": "Bhagwan Traders"
        },
        "order_items": [
            {
                "id": 30,
                "quantity": 1,
                "price": "69999.00",
                "product": {
                    "id": 2,
                    "name": "iPhone 13",
                    "description": "Apple smartphone",
                    "image_url": "https://materialmart.shop/uploads/product/1752582074726-furniture-removebg-preview.png",
                    "price": 69999,
                    "is_active": 1,
                    "stock": 30,
                    "sub_category_id": 10
                }
            }
        ]
    },
    "status": "Dispatched",
    "message": "Order dispatched successfully",
    "timestamp": "2025-07-27T06:16:16.166Z"
}
```


