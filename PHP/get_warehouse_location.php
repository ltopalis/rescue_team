<?php
include './connect_db.php';

$query =   "SELECT LONGTITUDE AS lng, LATITUDE AS lat 
            FROM LOCATIONS 
            WHERE USER = 'ADMIN';";
$result = $conn->query($query);

$row = $result->fetch_assoc();

echo json_encode($row);

$conn->close();

?>
