<?php
include './connect_db.php';

$sqlInserts = $_POST['queries'];

try {
    if ($conn->multi_query($sqlInserts)) {
        do {
            if ($result = $conn->store_result()) {
                while ($row = $result->fetch_assoc()) { echo "test"; }
                $result->free();
            }
        } while ($conn->next_result());

        $send = "SUCCESS";

    } else {
        $send = $send . " \n" . "Error executing batch of commands: " . $conn->error;
    }

    echo json_encode($send);
    
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        echo json_encode("DUPLICATE_ENTRY: " . $e->getLine());
    } else
        echo json_encode("UNKNOWN_ERROR: " . $e->getMessage() . " " . $e->getCode());
}


$conn->close();

?>