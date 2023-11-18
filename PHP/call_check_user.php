<?php
include './connect_db.php';

$login_username = $_POST['login_username'];
$login_password = $_POST['login_password'];
$sql = "CALL CHECK_USER('$login_username', '$login_password', @name, @role, @info)";
$conn->query($sql);

$sql_select = "SELECT @name AS name, @role AS role, @info AS info";
$result = $conn->query($sql_select);
$row = $result->fetch_assoc();

echo json_encode($row);

$conn->close();
?>