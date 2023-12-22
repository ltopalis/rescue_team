<?php
include "./connect_db.php";

try {
    $category_name = $_POST["new_category"];

    $query = "INSERT INTO CATEGORIES(CATEGORY_NAME) VALUE ('" . $category_name . "');";
    $result = $conn->query($query);

    if ($result = 1)
        echo json_encode("SUCCESS");
    else
        echo json_encode("UNEXPECTED_ERROR");
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        echo json_encode("DUPLICATE_ENTRY");
    } else
        echo json_encode($e->getMessage() . " " . $e->getCode());
}

$conn->close();
?>