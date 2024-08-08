DROP DATABASE IF EXISTS CEID_RESCUE_PROGRAM;
CREATE DATABASE IF NOT EXISTS CEID_RESCUE_PROGRAM;
USE CEID_RESCUE_PROGRAM;

CREATE TABLE IF NOT EXISTS USERS(
								                USERNAME VARCHAR(50)                         NOT NULL PRIMARY KEY,
                                PASSWORD VARCHAR(50)                         NOT NULL,
                                NAME     VARCHAR(50)                         NOT NULL,
                                ROLE     ENUM('RESCUER', 'ADMIN', 'CITIZEN') NOT NULL,
                                ACTIVE   BOOLEAN                             NULL DEFAULT NULL);
                                
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
                        IN ACTIVE     BOOLEAN,
                        IN LONGTITUDE FLOAT8,
                        IN LATITUDE   FLOAT8)
BEGIN
	START TRANSACTION;
    
    INSERT INTO USERS     VALUE (USERNAME, PASSWORD, NAME, ROLE, ACTIVE);
    INSERT INTO LOCATIONS VALUES(USERNAME, LONGTITUDE, LATITUDE);
    
    COMMIT;
END $$

DELIMITER ;

INSERT INTO USERS VALUES  ('6925874523', 'rescuer', 'Jeanne',  'RESCUER', 0),
                          ('6942384507', 'rescuer', 'Annie',   'RESCUER', 0),
                          ('6942387456', 'citizen', 'Dangelo', 'CITIZEN', NULL),
                          ('6945203357', 'rescuer', 'Tiffany', 'RESCUER', 0),
                          ('6945384502', 'rescuer', 'Adam',    'RESCUER', 0),
                          ('6952147620', 'citizen', 'Kai',     'CITIZEN', NULL),
                          ('6952486520', 'rescuer', 'Samuel',  'RESCUER', 0),
                          ('6972004599', 'rescuer', 'Hunter',  'RESCUER', 0),
                          ('6972148630', 'citizen', 'Dylan',   'CITIZEN', NULL),
                          ('6974106795', 'rescuer', 'Donald',  'RESCUER', 0),
                          ('6975384698', 'rescuer', 'Lydia',   'RESCUER', 0),
                          ('6979531485', 'citizen', 'Renata',  'CITIZEN', NULL),
                          ('6985247630', 'citizen', 'Adler',   'CITIZEN', NULL),
                          ('6985357420', 'citizen', 'Robert',  'CITIZEN', NULL),
                          ('ADMIN',      'ADMIN',   'ADMIN',   'ADMIN',   NULL); -- THE COORDINATES OF ADMIN REPRESENT THE COORDINATES OF WAREHOUSE 

INSERT INTO LOCATIONS VALUES  ('6925874523', 23.680285104372665, 38.01422306032742),
                              ('6942384507', 23.75645936915274,  38.008397673980205),
                              ('6942387456', 23.774945101238153, 37.99724263489743),
                              ('6945203357', 23.686115117219096, 37.97856244300957),
                              ('6945384502', 23.750418616997905, 37.97765260701589),
                              ('6952147620', 23.74152907647424,  38.00786838467143),
                              ('6952486520', 23.787440201552055, 37.93164766971562),
                              ('6972004599', 23.702354660299708, 37.94988705705418),
                              ('6972148630', 23.708481822213773, 37.933062680075096),
                              ('6974106795', 23.781522818543493, 38.00023082294719),
                              ('6975384698', 23.70361186067852,  37.944267453252756),
                              ('6979531485', 23.683677860777987, 37.97447456836173),
                              ('6985247630', 23.73127585560641,  37.94735712858567),
                              ('6985357420', 23.69310447021422,  37.997984409400686),
                              ('ADMIN',      23.735404014587406, 37.97586815961329);
