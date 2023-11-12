<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = new mysqli("localhost", "root", "root", "ceid_rescue_program");

if (isset($_POST['login_username']) && isset($_POST['login_password'])) {
    $username = $_POST['login_username'];
    $password = $_POST['login_password'];

    $mysqli->query("SET @name=''");
    $mysqli->query("SET @info=''");
    $mysqli->query("SET @role=''");
    $query = "CALL CHECK_USER('" . $username . "','" . $password . "', @name, @role, @info);";
    $mysqli->query($query);

    $result = $mysqli->query("SELECT @name, @role, @info");

    $row = $result->fetch_assoc();
    echo $row['@name'] . " | " . $row["@role"] . " | " . $row['@info'];
}

if (isset($_POST['signup_username']) && isset($_POST['signup_password']) && isset($_POST['signup_name'])) {

    try {
        $username = $_POST['signup_username'];
        $password = $_POST['signup_password'];
        $name = $_POST['signup_name'];
        $role = $_POST['selectedRole'];

        if ($role == "Πολίτης")
            $role = "CITIZEN";
        else
            $role = "RESCUER";

        $query = "CALL ADD_USER('" . $username . "','" . $password . "', '" . $name . "', '" . $role . "')";
        $result = $result = $mysqli->query($query);

        echo $result;
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) {
            echo 
            '<div class="alert alert-danger" role="alert">
                O xρήστης υπάρχει ήδη. Δοκιμάστε κάποιο άλλο όνομα χρήστη.
            </div>';
        } else
            echo $e->getMessage() . " " . $e->getCode();
    }


    // $row = $result->fetch_assoc();
    // echo $row['@name'] . " | " . $row["@role"] ." | ". $row['@info'];     
}



$mysqli->close();
?>