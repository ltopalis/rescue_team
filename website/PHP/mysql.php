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

    if ($row["@info"] == "UNKNOWN_USER")
        echo
            '<div class="alert alert-danger" role="alert" id="alert">
                O xρήστης δεν υπάρχει. Κάνε δωρεάν εγγραφή!
            </div>';
    else if ($row['@info'] == 'WRONG_USERNAME')
        echo
            '<div class="alert alert-danger" role="alert" id="alert">
                To όνομα χρήστη είναι λάθος!
            </div>';
    else if ($row['@info'] == 'WRONG_PASSWORD')
        echo
            '<div class="alert alert-danger" role="alert" id="alert">
                Ο κωδικός πρόσβασης είναι λάθος!
            </div>';
    else if ($row['@info'] == 'SUCCESS') {
        $data = array('name' => $row['@name'], 'role' => $row['@role']);
        echo json_encode($data);
    }
    // In case of debugging
    else
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
        $result = $mysqli->query($query);

        if ($result = 1)
            echo
                '<div class="alert alert-success" role="alert">
                Η εγγραφή πραγματοποιήθηκε με επιτυχία!
            </div>';
        else
            echo
                '<div class="alert alert-error" role="alert">
                Προκλήθηκε άγνωστο σφάλμα. Ξαναδοκιμάστε!
            </div>';
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() == 1062) {
            echo
                '<div class="alert alert-danger" role="alert">
                O xρήστης υπάρχει ήδη. Δοκιμάστε κάποιο άλλο όνομα χρήστη.
            </div>';
        } else
            echo $e->getMessage() . " " . $e->getCode();
    }
}

$mysqli->close();
?>