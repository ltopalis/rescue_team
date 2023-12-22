<?php
$servername = "mysql";
$username = "root";
$password = "root_password";
$dbname = "CEID_RESCUE_PROGRAM";

// Create connection
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
