DROP DATABASE IF EXISTS CEID_RESCUE_PROGRAM;
CREATE DATABASE IF NOT EXISTS CEID_RESCUE_PROGRAM;
USE CEID_RESCUE_PROGRAM;

CREATE TABLE IF NOT EXISTS USERS(
								                USERNAME VARCHAR(50)                         NOT NULL PRIMARY KEY,
                                PASSWORD VARCHAR(50)                         NOT NULL,
                                NAME     VARCHAR(50)                         NOT NULL,
                                ROLE     ENUM('RESCUER', 'ADMIN', 'CITIZEN') NOT NULL);
                                
CREATE TABLE IF NOT EXISTS LOCATIONS(
									                  USER       VARCHAR(50) NOT NULL PRIMARY KEY,
                                    LONGTITUDE FLOAT8,
                                    LATITUDE   FLOAT8,
                                    
                                    FOREIGN KEY (USER) REFERENCES USERS(USERNAME));

DELIMITER $$
CREATE PROCEDURE CHECK_USER(
							              IN  check_username               VARCHAR(50), 
							              IN  check_password               VARCHAR(50), 
                            OUT checked_name                 VARCHAR(50),
                            OUT checked_role                 VARCHAR(50),
                            OUT checked_longtitude           FLOAT8,
                            OUT checked_latitude             FLOAT8,
                            OUT checked_warehouse_longtitude FLOAT8,
                            OUT checked_warehouse_latitude   FLOAT8,
                            OUT info                         VARCHAR(50))
BEGIN
	  DECLARE return_name       VARCHAR(50) DEFAULT NULL;
    DECLARE return_role       VARCHAR(50) DEFAULT NULL;
    DECLARE return_password   VARCHAR(50) DEFAULT NULL;
    DECLARE return_username   VARCHAR(50);
	  DECLARE return_longtitude FLOAT8;
    DECLARE return_latitude   FLOAT8;
    
    DECLARE return_warehouse_latitude FLOAT8;
    DECLARE return_warehouse_longtitude FLOAT8;
    
    SELECT USERNAME, PASSWORD, NAME, ROLE, LONGTITUDE, LATITUDE 
		  INTO return_username, return_password, return_name, return_role, return_longtitude, return_latitude
    FROM USERS JOIN LOCATIONS
		  ON USERS.USERNAME = LOCATIONS.USER
    WHERE USERS.USERNAME = check_username;
    
    SELECT LONGTITUDE, LATITUDE 
		  INTO return_warehouse_longtitude, return_warehouse_latitude
	  FROM LOCATIONS
    WHERE USER = "ADMIN";
    
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
      SET checked_longtitude = return_longtitude;
      SET checked_latitude = return_latitude;
      SET checked_warehouse_longtitude = return_warehouse_longtitude;
      SET checked_warehouse_latitude = return_warehouse_latitude;
	END IF;

END $$

CREATE PROCEDURE ADD_USER(
                        IN USERNAME   VARCHAR(50),
                        IN PASSWORD   VARCHAR(50),
                        IN NAME       VARCHAR(50),
                        IN ROLE       ENUM('RESCUER', 'ADMIN', 'CITIZEN'),
                        IN LONGTITUDE FLOAT8,
                        IN LATITUDE   FLOAT8)
BEGIN
	START TRANSACTION;
    
    INSERT INTO USERS     VALUE (USERNAME, PASSWORD, NAME, ROLE);
    INSERT INTO LOCATIONS VALUES(USERNAME, LONGTITUDE, LATITUDE);
    
    COMMIT;
END $$

DELIMITER ;

INSERT INTO USERS     VALUE ('ADMIN', "ADMIN", "ADMIN", "ADMIN"); -- THE COORDINATES OF ADMIN REPRESENT THE COORDINATES OF WAREHOUSE 
INSERT INTO LOCATIONS VALUE ('ADMIN', 23.735404014587406, 37.97586815961329);

INSERT INTO USERS     VALUE ('6', "rescuer", "Adam", "RESCUER");
INSERT INTO LOCATIONS VALUE ('6', 23.178512286321048, 37.98529260096583);

INSERT INTO USERS     VALUE ('6985357420', "citizen", "Robert", "CITIZEN");
INSERT INTO LOCATIONS VALUE ('6985357420', 37.77708715873785, 23.921568977728874);
