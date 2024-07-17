<?php
include './connect_db.php';

$updateData = file_get_contents("php://input");

$data = json_decode($updateData, true);

$sqlQueries = "";
foreach ($data as $item) {
	$id = $item['id'];
    $discontinued = $item['discontinued'];
	
	$sqlQueries .= "UPDATE PRODUCTS SET discontinued = " . $discontinued . " WHERE ID = " . $id. ";";
}

if ($conn->multi_query($sqlQueries)) {
	echo "Success";
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
