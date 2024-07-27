# Product APIs documentation

## GET

### Get All Products Information

**URL**: `/all/`

**Method**: `GET`

**Description**: Retrieves all data of all products in an array of objects.

**Path Parameters**:
- `None`

**Query Parameters**:
- `None`

### Get Products Information

**URL**: `/`

**Method**: `GET`

**Description**: Retrieves product cards in an array of objects.

**Path Parameters**:
- `None`

**Query Parameters**:
- `None`

### Get Product Details

**URL**: `/{uno}/`

**Method**: `GET`

**Description**: Retrieves all related data of all products in an object.

**Path Parameters**:
- `uno` (UUID / String): Universal identifier of product.

**Query Parameters**:
- `None`

## POST

### Post New Product Information

**URL**: `/newProduct/`

**Method**: `POST`

**Description**: Creates a new product if user is a manufacturer.

**Path Parameters**:
- `None`

**Query Parameters**:
- `None`

**Headers**:
- `User-Type: MANUFACTURER`
- `Authorization: Bearer <USER_AUTH_KEY>`

## DELETE

### Delete Product

**URL**: `/removeProduct/`

**Method**: `DELETE`

**Description**: Removes a product and it related informations in databank.

**Path Parameters**:
- `None`

**Query Parameters**:
- `None`

**Headers**:
- `User-Type: MANUFACTURER`
- `body: {..., forceDelete = true, ...}`
- `Authorization: Bearer <USER_AUTH_KEY>`

----------------------------
Standard 
----------------------------

### Get <Info_Type> Information

**URL**: `/<api_url>/{path_parameter}?<query_parameter>=<qp_value>`

**Method**: `<METHOD>`

**Description**: Retrieve information about a <info>.

**Path Parameters**:
- `path_parameter | None` (<DataType>): <description>.

**Query Parameters**:
- `Parameter | None`

**Headers**:
- `Authorization: Bearer <USER_AUTH_KEY>`
