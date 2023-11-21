DROP DATABASE IF EXISTS CEID_RESCUE_PROGRAM;
CREATE DATABASE IF NOT EXISTS CEID_RESCUE_PROGRAM;
USE CEID_RESCUE_PROGRAM;

CREATE TABLE IF NOT EXISTS USERS(
								USERNAME VARCHAR(50) NOT NULL PRIMARY KEY,
                                PASSWORD VARCHAR(50) NOT NULL,
                                NAME VARCHAR(50) NOT NULL,
                                ROLE ENUM('RESCUER', 'ADMIN', 'CITIZEN') NOT NULL);

DELIMITER $$
CREATE PROCEDURE CHECK_USER(
							IN check_username VARCHAR(50), 
							IN check_password VARCHAR(50), 
                            OUT checked_name VARCHAR(50),
                            OUT checked_role VARCHAR(50),
                            OUT info VARCHAR(50))
BEGIN
	DECLARE return_name VARCHAR(50) DEFAULT NULL;
    DECLARE return_role VARCHAR(50) DEFAULT NULL;
    DECLARE return_password VARCHAR(50) DEFAULT NULL;
    DECLARE return_username VARCHAR(50);
	
    SELECT USERNAME, PASSWORD, NAME, ROLE INTO return_username, return_password, return_name, return_role 
    FROM USERS
    WHERE USERNAME = check_username;
    
    IF return_username IS NULL THEN
		SET info = "UNKNOWN_USER";
	ELSEIF check_password is NULL THEN
        SET info = "WRONG_USERNAME";
	ELSEIF check_password != return_password THEN
		SET info = 'WRONG_PASSWORD';
        SET return_name = NULL;
        SET return_role = NULL;
    ELSEIF check_password = return_password THEN
		SET info = "SUCCESS";
        SET checked_name = return_name;
        SET checked_role = return_role;
	END IF;
        
END $$

CREATE PROCEDURE ADD_USER(
                        IN USERNAME VARCHAR(50),
                        IN PASSWORD VARCHAR(50),
                        IN NAME VARCHAR(50),
                        IN ROLE ENUM('RESCUER', 'ADMIN', 'CITIZEN'))
BEGIN
    INSERT INTO USERS VALUE (USERNAME, PASSWORD, NAME, ROLE);
END $$
DELIMITER ;

-- CALL ADD_USER("test1", "testpass", "test", "admin"); 


-- SELECT * FROM USERS;

-- CALL CHECK_USER("test1", "testpass", @name, @role, @info);

-- SELECT @name, @role, @info;
