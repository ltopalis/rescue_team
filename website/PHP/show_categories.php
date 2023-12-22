<?php
include './connect_db.php';

$query = "SELECT * FROM CATEGORIES";

$result = $conn->query($query);

$categories = array();

while($row = $result->fetch_assoc()){
    $categories[] = $row["CATEGORY_NAME"];
}

echo json_encode($categories);

$conn->close();
?>