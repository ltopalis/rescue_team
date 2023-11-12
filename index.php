<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login In</title>

    <!-- For Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous">

    <!-- For the icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

    <!-- For CSS -->
    <link rel="stylesheet" href="E:\Program Files\xampp\htdocs\Project\CSS\loginStyle.css">


    <!-- TODO: Σύνδεση με το αρχείο -->

    <style>
        section {
            padding: 60px 0;
        }

        .container-lg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .hidden {
            display: none;
        }
    </style>
</head>

<body>


    <section id="login-page" class="">
        <div class="container-lg">
            <div class="row justify-content-center my-5">
                <div class="col-md-7 col-md-5">
                    <div class="text-center ">
                        <h2>Σύνδεση</h2>
                        <p class="lead">Σύνδεση στον Λογαρισμό</p>
                    </div>
                    <form action="" method="POST" id="login-form">
                        <div class="mb-4 input-group">
                            <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
                            <input type="text" class="form-control" id="name" name="login_username"
                                placeholder="Όνομα Χρήστη" required>
                        </div>

                        <div class="mb-4 input-group">
                            <span class="input-group-text"><i class="bi bi-key"></i></span>
                            <input type="password" class="form-control" name="login_password" id="password"
                                placeholder="Κωδικός Πρόσβασης" required>
                        </div>

                        <div class="mb-4 text-center"><a href="#" onclick="showSection('signup-page')">Δεν έχεις
                                λογαριασμό; Δημιούργησε έναν
                                εντελώς δωρεάν!</a></div>

                        <div class="mb-4 text-center">
                            <button type="submit" class="btn btn-secondary">Σύνδεση</button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    </section>

    <section id="signup-page" class="hidden">
        <div class="container-lg">
            <div class="row justify-content-center my-5">
                <div class="col-md-7 col-md-5">
                    <div class="text-center">
                        <h2>Εγγραφή</h2>
                        <p class="lead">Δημιουργήστε έναν Δωρεάν Λογαριασμό</p>
                    </div>
                    <form action="" method="POST" id="signup-form">
                        <div class="mb-4 input-group">
                            <span class="input-group-text"><i class="bi bi-file-person-fill"></i></span>
                            <input type="text" class="form-control" name="signup_name" id="name" placeholder="Όνομα"
                                required>
                        </div>

                        <div class="mb-4 input-group">
                            <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
                            <input type="text" class="form-control" id="name" name="signup_username"
                                placeholder="Όνομα Χρήστη" required>
                        </div>

                        <div class="mb-4 input-group">
                            <span class="input-group-text"><i class="bi bi-key"></i></span>
                            <input type="password" class="form-control" name="signup_password" id="password"
                                placeholder="Κωδικός Πρόσβασης" required>
                        </div>

                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle" type="button" id="roleDropdown"
                                data-bs-toggle="dropdown" aria-expanded="false">
                                Πολίτης
                            </button>

                            <ul class="dropdown-menu" aria-labelledby="roleDropdown">
                                <li><a class="dropdown-item" href="#" onclick="selectRole('Διασώστης')">Διασώστης</a>
                                </li>
                                <li><a class="dropdown-item" href="#" onclick="selectRole('Πολίτης')">Πολίτης</a></li>
                            </ul>

                            <!-- Hidden Input for Selected Role -->
                            <input type="hidden" id="selectedRole" name="selectedRole" value="Πολίτης" required>


                            <div class="mb-4 text-center"><a href="#" onclick="showSection('login-page')">Έχεις
                                    Λογαριασμό; Συνδέσου!</a></div>

                            <div class="mb-4 text-center">
                                <button type="submit" class="btn btn-secondary">Εγγραφή</button>
                            </div>
                    </form>

                </div>
            </div>
        </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-gtEjrD/SeCtmISkJkNUaaKMoLD0//ElJ19smozuHV6z3Iehds+3Ulb9Bn9Plx0x4"
        crossorigin="anonymous"></script>

    <script src="./Javascript/loginPage.js">
    </script>

    <?php
    include("./PHP/mysql.php");
    ?>
</body>

</html>