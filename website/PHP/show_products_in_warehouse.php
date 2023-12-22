<?php
include("./connect_db.php");

$query = "SELECT PRODUCTS.ID, PRODUCT_NAME, CATEGORY, DETAIL_NAME, DETAIL_VALUE, AMOUNT
FROM PRODUCTS 
	JOIN CATEGORIES ON PRODUCTS.CATEGORY = CATEGORIES.CATEGORY_NAME
    LEFT JOIN DETAILS_OF_PRODUCTS ON DETAILS_OF_PRODUCTS.PRODUCT = PRODUCTS.ID
    JOIN WAREHOUSE ON WAREHOUSE.PRODUCT = PRODUCTS.ID";

$result = $conn->query($query);

$products = array();

while ($row = $result->fetch_assoc()){
    $products[] = $row;
}

echo json_encode($products);

$conn->close();
