<?php

include("./connect_db.php");
try {
    $phone = $_POST["phone"];
    $password = $_POST["password"];
    $name = $_POST["name"];

    $query = "CALL ADD_USER('" . $phone . "','" . $password . "','" . $name . "','" . "RESCUER', 0, 0)";
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