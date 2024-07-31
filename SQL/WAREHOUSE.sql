USE CEID_RESCUE_PROGRAM;

CREATE TABLE IF NOT EXISTS CATEGORIES(CATEGORY_NAME VARCHAR(50) NOT NULL PRIMARY KEY);
                                    
CREATE TABLE IF NOT EXISTS PRODUCTS(
									ID INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
                                    CATEGORY VARCHAR(50) NOT NULL,
                                    PRODUCT_NAME VARCHAR(50) NOT NULL,
                                    DISCONTINUED BOOLEAN NOT NULL DEFAULT FALSE,
                                    
                                    FOREIGN KEY (CATEGORY) REFERENCES CATEGORIES(CATEGORY_NAME));
                                    
CREATE TABLE IF NOT EXISTS DETAILS_OF_PRODUCTS(
                                                PRODUCT INT NOT NULL,
                                                DETAIL_NAME VARCHAR(200) NOT NULL,
                                                DETAIL_VALUE VARCHAR(200) NOT NULL,
                                                
                                                PRIMARY KEY (PRODUCT, DETAIL_NAME, DETAIL_VALUE),
                                                FOREIGN KEY (PRODUCT) REFERENCES PRODUCTS(ID));

CREATE TABLE IF NOT EXISTS WAREHOUSE(
                                    PRODUCT INT NOT NULL PRIMARY KEY,
                                    AMOUNT INT NOT NULL DEFAULT 0,
                                    
                                    FOREIGN KEY(PRODUCT) REFERENCES PRODUCTS(ID));

CREATE TABLE IF NOT EXISTS VAN_LOAD(
                                    product INT NOT NULL,
                                    amount  INT NOT NULL,
                                    rescuer VARCHAR(50) NOT NULL,

                                    PRIMARY KEY (product, rescuer),
                                    FOREIGN KEY (product) REFERENCES PRODUCTS(ID),
                                    FOREIGN KEY (rescuer) REFERENCES USERS(USERNAME));

DELIMITER $$

CREATE PROCEDURE ADD_CATEGORY(IN p_CATEGORY VARCHAR(50))
BEGIN
	DECLARE FOUND_CATEGORY VARCHAR(50);
    
	SELECT CATEGORY_NAME INTO FOUND_CATEGORY
    FROM CATEGORIES
    WHERE CATEGORY_NAME = p_CATEGORY;
    
    IF FOUND_CATEGORY IS NULL THEN
		START TRANSACTION;
		INSERT INTO CATEGORIES(CATEGORY_NAME) VALUES (p_CATEGORY);
        COMMIT;
	END IF;
END$$

-- Όταν τα p_DETAIL_NAME και p_DETAIL_VALUE έχουν την κενή συμβολοσειρά 
-- δεν αποθηκεύεται τίποτε στην DETAILS_OF_PRODUCTS άρα η αμφάνιση
--  των στοιχείων πρέπει να γίενται μέσω LEFT JOIN

CREATE PROCEDURE ADD_NEW_PRODUCT(
								IN p_CATEGORY VARCHAR(50),
                                IN p_PRODUCT VARCHAR(50),
                                IN p_DETAIL_NAME VARCHAR(200),
                                IN p_DETAIL_VALUE VARCHAR(200))
BEGIN
	DECLARE PRODUCT_ID INT;
    DECLARE DETAILS_PRODUCT_ID INT; 
    DECLARE PRODUCT_WAREHOUSE VARCHAR(50) DEFAULT NULL;
    
	SELECT ID INTO PRODUCT_ID
	FROM PRODUCTS
	WHERE PRODUCT_NAME = p_PRODUCT;
    
    SELECT PRODUCT INTO DETAILS_PRODUCT_ID
    FROM DETAILS_OF_PRODUCTS
    WHERE PRODUCT = PRODUCT_ID AND
		DETAIL_NAME = p_DETAIL_NAME AND
        DETAIL_VALUE = p_DETAIL_VALUE;
        
	SELECT PRODUCT INTO PRODUCT_WAREHOUSE
    FROM WAREHOUSE
    WHERE PRODUCT = PRODUCT_ID;
    
        
	IF DETAILS_PRODUCT_ID IS NULL THEN

		START TRANSACTION;

		IF PRODUCT_ID IS NULL THEN
			INSERT INTO PRODUCTS(CATEGORY, PRODUCT_NAME) VALUES (p_CATEGORY, p_PRODUCT);
			
			SELECT ID INTO PRODUCT_ID
			FROM PRODUCTS
			WHERE PRODUCT_NAME = p_PRODUCT;
		END IF;

		IF p_DETAIL_NAME != "" AND p_DETAIL_VALUE != "" THEN
			INSERT INTO DETAILS_OF_PRODUCTS VALUE (PRODUCT_ID, p_DETAIL_NAME, p_DETAIL_VALUE);
		END IF;
        
        IF PRODUCT_WAREHOUSE IS NULL THEN
			INSERT INTO WAREHOUSE(PRODUCT, AMOUNT) VALUES (PRODUCT_ID, 0);
		END IF;

		COMMIT;
	ELSE 
		SELECT "PROBLEM", p_CATEGORY, p_PRODUCT, p_DETAIL_NAME, p_DETAIL_VALUE;
        
	END IF;

END$$

CREATE PROCEDURE ADD_NEW_PRODUCT2(
								IN p_CATEGORY VARCHAR(50),
                                IN p_PRODUCT VARCHAR(50),
                                IN p_DETAIL_NAME VARCHAR(200),
                                IN p_DETAIL_VALUE VARCHAR(200))
BEGIN
	DECLARE FOUND_CATEGORY VARCHAR(50) DEFAULT NULL;
    DECLARE FOUND_PRODUCT INT DEFAULT NULL;
    DECLARE FOUND_PRODUCT_IN_WAREHOUSE INT DEFAULT NULL;
    DECLARE FOUND_DETAIL VARCHAR(200) DEFAULT NULL;
    
    SELECT CATEGORY_NAME 
    	INTO FOUND_CATEGORY
    FROM CATEGORIES
    WHERE CATEGORY_NAME = p_CATEGORY;
    
    SELECT ID
    	INTO FOUND_PRODUCT
    FROM PRODUCTS
    WHERE PRODUCT_NAME = p_PRODUCT;


    START TRANSACTION;

    IF FOUND_CATEGORY IS NULL 
    THEN    
    	INSERT INTO CATEGORIES VALUES(p_CATEGORY);
    END IF;

    IF FOUND_PRODUCT IS NULL
    THEN
    	INSERT INTO PRODUCTS(CATEGORY, PRODUCT_NAME) VALUES (p_CATEGORY, p_PRODUCT);

        SELECT ID
    		INTO FOUND_PRODUCT
    	FROM PRODUCTS
    	WHERE PRODUCT_NAME = p_PRODUCT;
    END IF;

    SELECT DETAIL_NAME
    	INTO FOUND_DETAIL
    FROM DETAILS_OF_PRODUCTS
    WHERE DETAIL_NAME = p_DETAIL_NAME
    	AND DETAIL_VALUE = p_DETAIL_VALUE
        AND PRODUCT = FOUND_PRODUCT;

    IF FOUND_DETAIL IS NULL
    THEN
    	INSERT INTO DETAILS_OF_PRODUCTS(DETAIL_NAME, DETAIL_VALUE, PRODUCT)
        	VALUES(p_DETAIL_NAME, p_DETAIL_VALUE, FOUND_PRODUCT);
    END IF; 

    SELECT PRODUCT 
        INTO FOUND_PRODUCT_IN_WAREHOUSE
    FROM WAREHOUSE
    WHERE PRODUCT = FOUND_PRODUCT;

    IF FOUND_PRODUCT_IN_WAREHOUSE IS NULL
    THEN
        INSERT INTO WAREHOUSE(PRODUCT, AMOUNT) VALUES (FOUND_PRODUCT, 0);
    END IF;

    COMMIT;

END$$

CREATE PROCEDURE ADD_PRODUCTS_IN_WAREHOUSE(
										IN p_PRODUCT VARCHAR(50), 
										IN p_CATEGORY VARCHAR(50),
                                        IN p_CATEGORY_DESCRIPTION VARCHAR(200),
										IN p_AMOUNT INT)
BEGIN
	DECLARE CATEGORY_ID INT;
    DECLARE PRODUCT_ID INT;
    DECLARE ID_WAREHOUSE INT;
    DECLARE STORED_AMOUNT INT;
	
    SELECT ID INTO CATEGORY_ID
    FROM CATEGORIES
    WHERE CATEGORY_NAME = p_CATEGORY;
    
    SELECT ID INTO PRODUCT_ID
    FROM PRODUCTS
    WHERE PRODUCT_NAME = p_PRODUCT;
    
    IF CATEGORY_ID IS NULL THEN
		INSERT INTO CATEGORIES(CATEGORY_NAME, DESCRIPTION) VALUES (p_CATEGORY, p_CATEGORY_DESCRIPTION);
        SELECT ID INTO CATEGORY_ID
		FROM CATEGORIES
		WHERE CATEGORY_NAME = p_CATEGORY;
    END IF;
    
    IF PRODUCT_ID IS NULL THEN
		INSERT INTO PRODUCTS(CATEGORY, PRODUCT_NAME) VALUES(CATEGORY_ID, p_PRODUCT);
        SELECT ID INTO PRODUCT_ID
		FROM PRODUCTS
		WHERE PRODUCT_NAME = p_PRODUCT;
    END IF;

	SELECT ID INTO ID_WAREHOUSE
    FROM WAREHOUSE
    WHERE PRODUCT = PRODUCT_ID;
    
    IF ID_WAREHOUSE IS NULL THEN 
		INSERT INTO WAREHOUSE(PRODUCT, AMOUNT) VALUES (PRODUCT_ID, p_AMOUNT);
	ELSE
		SELECT AMOUNT INTO STORED_AMOUNT
        FROM WAREHOUSE
        WHERE ID = ID_WAREHOUSE; 
        
        
        UPDATE WAREHOUSE
        SET AMOUNT = p_AMOUNT + STORED_AMOUNT
        WHERE ID = ID_WAREHOUSE;
	END IF;

END$$

CREATE PROCEDURE UNLOAD_PRODUCTS(
                                IN p_PRODUCT_ID INT,
                                IN p_amount     INT,
                                IN p_rescuer    VARCHAR(50))
BEGIN

    START TRANSACTION;

    UPDATE WAREHOUSE
    SET AMOUNT = AMOUNT + p_amount
    WHERE PRODUCT = p_PRODUCT_ID;


    DELETE FROM VAN_LOAD
    WHERE product = p_PRODUCT_ID 
        AND rescuer = p_rescuer;

    COMMIT;

END$$
DELIMITER ;

-- ADD CATEGORIES
CALL ADD_CATEGORY('Medicines');

-- ADD PRODUCTS
CALL ADD_NEW_PRODUCT('Medicines', 'Aspirin', 'pills', '40');
CALL ADD_NEW_PRODUCT('Medicines', 'Aspirin', 'active substance', '500mg');

CALL ADD_NEW_PRODUCT('Medicines', 'Bandage', 'length', '50m');

CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'active substance', '500mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'dosage form', 'capsule');
CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'active substance', '200mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'dosage form', 'tablet');
CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'active substance', 'single dose');
CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'dosage form', 'injection');
CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'administration', 'intramuscular');

CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'active substance', 'sachet for 1 liter of solution');
CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'dosage form', 'powder');
CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'administration', 'oral solution');

CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'active substance', '500mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'dosage form', 'tablet');
CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'active substance', '1%');
CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'dosage form', 'cream');
CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'administration', 'topical');

CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'active substance', '2mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'dosage form', 'capsule');
CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'active substance', '500mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'dosage form', 'tablet');
CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'active substance', '100mg');
CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'dosage form', 'capsule');
CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'administration', 'oral');

CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'active substance', '0.5% solution');
CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'dosage form', 'solution');
CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'administration', 'topical');

-- ADD LOAD
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (1, 5, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (5, 4, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (6, 9, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (7, 10, '6945384502');