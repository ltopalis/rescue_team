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

CREATE TABLE IF NOT EXISTS ANNOUNCEMENT(
                                        id      INT       NOT NULL AUTO_INCREMENT,
                                        product INT       NOT NULL,
                                        date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),

                                        PRIMARY KEY(id, product),
                                        FOREIGN KEY(product) REFERENCES PRODUCTS(ID));

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

CREATE PROCEDURE LOAD_PRODUCTS(
                                IN p_product_id INT,
                                IN p_amount     INT,
                                IN p_rescuer    VARCHAR(50))
BEGIN
    DECLARE FOUND_PRODUCT INT DEFAULT NULL;

    START TRANSACTION;

    UPDATE WAREHOUSE
    SET AMOUNT = AMOUNT - p_amount
    WHERE PRODUCT = p_product_id;

    SELECT product
        INTO FOUND_PRODUCT
    FROM VAN_LOAD
    WHERE rescuer = p_rescuer
        AND product = p_product_id;

    IF FOUND_PRODUCT IS NULL THEN
        INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES(p_product_id, p_amount, p_rescuer);
    ELSE
        UPDATE VAN_LOAD
        SET amount = amount + p_amount
        WHERE product = p_product_id;
    END IF;

    COMMIT;

END$$
DELIMITER ;

-- -- ADD CATEGORIES
-- CALL ADD_CATEGORY('Medicines');

-- -- ADD PRODUCTS
-- CALL ADD_NEW_PRODUCT('Medicines', 'Aspirin', 'pills', '40');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Aspirin', 'active substance', '500mg');
-- UPDATE WAREHOUSE SET AMOUNT = 9 WHERE PRODUCT = 1;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Bandage', 'length', '50m');
-- UPDATE WAREHOUSE SET AMOUNT = 7 WHERE PRODUCT = 2;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'active substance', '500mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'dosage form', 'capsule');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Amoxicillin Capsules', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 6 WHERE PRODUCT = 3;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'active substance', '200mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'dosage form', 'tablet');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Ibuprofen Tablets', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 28 WHERE PRODUCT = 4;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'active substance', 'single dose');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'dosage form', 'injection');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Tetanus Toxoid Vaccine', 'administration', 'intramuscular');
-- UPDATE WAREHOUSE SET AMOUNT = 95 WHERE PRODUCT = 5;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'active substance', 'sachet for 1 liter of solution');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'dosage form', 'powder');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Oral Rehydration Salts', 'administration', 'oral solution');
-- UPDATE WAREHOUSE SET AMOUNT = 54 WHERE PRODUCT = 6;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'active substance', '500mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'dosage form', 'tablet');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Peracetamol Tablets', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 19 WHERE PRODUCT = 7;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'active substance', '1%');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'dosage form', 'cream');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Hydrocortisone Cream', 'administration', 'topical');
-- UPDATE WAREHOUSE SET AMOUNT = 92 WHERE PRODUCT = 8;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'active substance', '2mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'dosage form', 'capsule');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Loperamide Capsules', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 59 WHERE PRODUCT = 9;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'active substance', '500mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'dosage form', 'tablet');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Ciprofloxacin Tablets', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 29 WHERE PRODUCT = 10;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'active substance', '100mg');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'dosage form', 'capsule');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Docycycline Capsules', 'administration', 'oral');
-- UPDATE WAREHOUSE SET AMOUNT = 45 WHERE PRODUCT = 11;

-- CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'active substance', '0.5% solution');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'dosage form', 'solution');
-- CALL ADD_NEW_PRODUCT('Medicines', 'Chlorhexidine Solution', 'administration', 'topical');
-- UPDATE WAREHOUSE SET AMOUNT = 57 WHERE PRODUCT = 12;

INSERT INTO CATEGORIES (CATEGORY_NAME)
VALUES 
    ('First Aid Supplies'),
    ('Food and Water Supplies'),
    ('Sanitation and Hygiene Supplies');

INSERT INTO PRODUCTS (CATEGORY, PRODUCT_NAME, DISCONTINUED)
VALUES
    -- First Aid Supplies
    ('First Aid Supplies', 'Bandage', 0),
    ('First Aid Supplies', 'Antiseptic Wipes', 0),
    ('First Aid Supplies', 'Gauze Pads', 0),
    ('First Aid Supplies', 'Adhesive Plasters', 1),
    ('First Aid Supplies', 'Elastic Bandage', 1),
    ('First Aid Supplies', 'Pain Reliever Tablets', 0),
    ('First Aid Supplies', 'Thermometer', 0),
    ('First Aid Supplies', 'Emergency Blanket', 0),

    -- Food and Water Supplies
    ('Food and Water Supplies', 'Canned Soup', 0),
    ('Food and Water Supplies', 'Protein Bars', 1),
    ('Food and Water Supplies', 'Dried Fruit Packs', 0),
    ('Food and Water Supplies', 'Instant Noodles', 0),
    ('Food and Water Supplies', 'Bottled Water', 1),
    ('Food and Water Supplies', 'Electrolyte Powder', 0),
    ('Food and Water Supplies', 'Canned Beans', 0),
    ('Food and Water Supplies', 'Granola', 0),

    -- Sanitation and Hygiene Supplies
    ('Sanitation and Hygiene Supplies', 'Toilet Paper', 0),
    ('Sanitation and Hygiene Supplies', 'Hand Sanitizer', 0),
    ('Sanitation and Hygiene Supplies', 'Soap Bars', 1),
    ('Sanitation and Hygiene Supplies', 'Disinfectant Spray', 0),
    ('Sanitation and Hygiene Supplies', 'Toothpaste', 0),
    ('Sanitation and Hygiene Supplies', 'Wet Wipes', 0),
    ('Sanitation and Hygiene Supplies', 'Feminine Hygiene Pads', 0),
    ('Sanitation and Hygiene Supplies', 'Trash Bags', 1);

INSERT INTO DETAILS_OF_PRODUCTS (PRODUCT, DETAIL_NAME, DETAIL_VALUE)
VALUES
    -- Bandage (ID = 1)
    (1, 'Length', '5m'),
    (1, 'Material', 'Cotton'),
    (1, 'Sterility', 'Sterile'),

    -- Antiseptic Wipes (ID = 2)
    (2, 'Quantity', '50 wipes'),
    (2, 'Alcohol Content', '70%'),
    (2, 'Packaging', 'Individually Wrapped'),

    -- Gauze Pads (ID = 3)
    (3, 'Size', '10x10 cm'),
    (3, 'Sterility', 'Sterile'),
    (3, 'Material', 'Cotton'),

    -- Adhesive Plasters (ID = 4)
    (4, 'Quantity', '100 pieces'),
    (4, 'Material', 'Hypoallergenic'),
    (4, 'Sizes', 'Assorted'),

    -- Elastic Bandage (ID = 5)
    (5, 'Length', '3m'),
    (5, 'Width', '10cm'),
    (5, 'Closure', 'Velcro'),

    -- Pain Reliever Tablets (ID = 6)
    (6, 'Quantity', '24 tablets'),
    (6, 'Dosage', '500mg'),
    (6, 'Type', 'Non-drowsy'),

    -- Thermometer (ID = 7)
    (7, 'Type', 'Digital'),
    (7, 'Response Time', '10 seconds'),
    (7, 'Battery Life', '1000 uses'),

    -- Emergency Blanket (ID = 8)
    (8, 'Material', 'Mylar'),
    (8, 'Size', '210x160 cm'),
    (8, 'Thickness', '12 microns'),

    -- Canned Soup (ID = 9)
    (9, 'Weight', '400g'),
    (9, 'Shelf Life', '2 years'),
    (9, 'Flavor', 'Chicken Noodle'),

    -- Protein Bars (ID = 10)
    (10, 'Quantity', '12 bars'),
    (10, 'Protein Content', '20g per bar'),
    (10, 'Flavor', 'Chocolate Peanut Butter'),

    -- Dried Fruit Packs (ID = 11)
    (11, 'Quantity', '5 packs'),
    (11, 'Weight', '100g per pack'),
    (11, 'Fruit Type', 'Mixed Berries'),

    -- Instant Noodles (ID = 12)
    (12, 'Quantity', '6 packs'),
    (12, 'Cooking Time', '3 minutes'),
    (12, 'Flavor', 'Spicy Chicken'),

    -- Bottled Water (ID = 13)
    (13, 'Volume', '1.5L'),
    (13, 'Quantity', '12 bottles'),
    (13, 'Purity', '99.9%'),

    -- Electrolyte Powder (ID = 14)
    (14, 'Quantity', '20 sachets'),
    (14, 'Flavor', 'Lemon-Lime'),
    (14, 'Serving Size', '1 sachet per 500ml water'),

    -- Canned Beans (ID = 15)
    (15, 'Weight', '400g'),
    (15, 'Type', 'Baked Beans'),
    (15, 'Shelf Life', '2 years'),

    -- Granola (ID = 16)
    (16, 'Weight', '500g'),
    (16, 'Type', 'Honey Oat'),
    (16, 'Gluten-Free', 'Yes'),

    -- Toilet Paper (ID = 17)
    (17, 'Quantity', '24 rolls'),
    (17, 'Ply', '2-ply'),
    (17, 'Material', 'Recycled Paper'),

    -- Hand Sanitizer (ID = 18)
    (18, 'Volume', '500ml'),
    (18, 'Alcohol Content', '70%'),
    (18, 'Type', 'Gel'),

    -- Soap Bars (ID = 19)
    (19, 'Quantity', '6 bars'),
    (19, 'Weight', '100g per bar'),
    (19, 'Scent', 'Unscented'),

    -- Disinfectant Spray (ID = 20)
    (20, 'Volume', '750ml'),
    (20, 'Kill Rate', '99.9% of germs'),
    (20, 'Scent', 'Fresh Lemon'),

    -- Toothpaste (ID = 21)
    (21, 'Volume', '100ml'),
    (21, 'Fluoride Content', '1450ppm'),
    (21, 'Flavor', 'Mint'),

    -- Wet Wipes (ID = 22)
    (22, 'Quantity', '80 wipes'),
    (22, 'Alcohol-Free', 'Yes'),
    (22, 'Scent', 'Aloe Vera'),

    -- Feminine Hygiene Pads (ID = 23)
    (23, 'Quantity', '20 pads'),
    (23, 'Absorbency', 'Super'),
    (23, 'Type', 'Winged'),

    -- Trash Bags (ID = 24)
    (24, 'Quantity', '50 bags'),
    (24, 'Capacity', '60L'),
    (24, 'Material', 'Biodegradable');

INSERT INTO WAREHOUSE 
VALUES
    (1, 89),
    (2, 92),
    (3, 93),
    (4, 0),
    (5, 0),
    (6, 23),
    (7, 45),
    (8, 53),
    (9, 28),
    (10, 0),
    (11, 33),
    (12, 15),
    (13, 0),
    (14, 30),
    (15, 23),
    (16, 24),
    (17, 52),
    (18, 87),
    (19, 0),
    (20, 33),
    (21, 26),
    (22, 30),
    (23, 71),
    (24, 0);


-- -- ADD LOAD
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (1, 5, '6945384502');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (5, 4, '6945384502');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (6, 9, '6945384502');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (7, 10, '6945384502');

-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (2, 1, '6925874523');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (4, 3, '6925874523');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (6, 5, '6925874523');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (8, 7, '6925874523');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (10, 9, '6925874523');

-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (5, 4, '6952486520');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (7, 6, '6952486520');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (9, 8, '6952486520');
-- INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (11, 10, '6952486520');

INSERT INTO VAN_LOAD(product, amount, rescuer) 
VALUES
        (21, 79, 6925874523),
        (22, 32, 6925874523),
        (14, 83, 6925874523),
        (18, 78, 6925874523),
        (1, 55, 6942384507),
        (6, 93, 6942384507),
        (15, 12, 6942384507),
        (1, 15, 6945384502),
        (21, 28, 6945384502),
        (7, 87, 6945384502),
        (23, 38, 6945384502),
        (2, 60, 6945384502),
        (12, 5, 6945384502),
        (1, 91, 6972004599),
        (23, 26, 6974106795),
        (21, 87, 6974106795),
        (11, 16, 6974106795),
        (15, 11, 6974106795),
        (8, 8, 6975384698),
        (3, 60, 6975384698),
        (22, 46, 6975384698),
        (7, 19, 6975384698),
        (6, 78, 6975384698);

INSERT INTO ANNOUNCEMENT(id, product, date)
VALUES
	(1,  9, "2013-03-03 10:18:00"),
	(1, 20, "2013-03-03 10:18:00"),
	(2, 15, "2003-11-18 10:15:00"),
	(2, 16, "2003-11-18 10:15:00"),
	(2,  8, "2003-11-18 10:15:00"),
	(2,  7, "2003-11-18 10:15:00"),
	(2, 21, "2003-11-18 10:15:00"),
	(3, 23, "2024-02-12 06:22:58"),
	(3, 14, "2024-02-12 06:22:58"),
	(3, 21, "2024-02-12 06:22:58"),
	(3, 18, "2024-02-12 06:22:58"),
	(3, 22, "2024-02-12 06:22:58"),
	(3,  6, "2024-02-12 06:22:58"),
	(3,  9, "2024-02-12 06:22:58"),
	(3,  1, "2024-02-12 06:22:58"),
	(3,  8, "2024-02-12 06:22:58"),
	(3,  7, "2024-02-12 06:22:58"),
	(4,  9, "2014-12-28 15:53:19"),
	(4, 21, "2014-12-28 15:53:19"),
	(5, 17, "2006-08-28 22:28:02"),
	(5,  3, "2006-08-28 22:28:02"),
	(5, 16, "2006-08-28 22:28:02"),
	(5,  9, "2006-08-28 22:28:02"),
	(5, 18, "2006-08-28 22:28:02"),
	(5, 14, "2006-08-28 22:28:02"),
	(6, 18, "2021-04-11 02:15:39"),
	(6, 21, "2021-04-11 02:15:39"),
	(6, 23, "2021-04-11 02:15:39"),
	(6, 15, "2021-04-11 02:15:39"),
	(6, 11, "2021-04-11 02:15:39"),
	(6, 20, "2021-04-11 02:15:39"),
	(6,  7, "2021-04-11 02:15:39"),
	(6,  1, "2021-04-11 02:15:39"),
	(7, 20, "2006-10-13 22:26:38"),
	(7,  3, "2006-10-13 22:26:38"),
	(7, 15, "2006-10-13 22:26:38"),
	(7,  8, "2006-10-13 22:26:38"),
	(7,  1, "2006-10-13 22:26:38"),
	(8, 17, "2004-05-26 10:43:37"),
	(8, 15, "2004-05-26 10:43:37"),
	(8, 22, "2004-05-26 10:43:37"),
	(8,  7, "2004-05-26 10:43:37"),
	(8, 21, "2004-05-26 10:43:37"),
	(9, 21, "2014-05-04 00:43:19"),
	(9,  7, "2014-05-04 00:43:19"),
	(9, 12, "2014-05-04 00:43:19"),
	(9,  1, "2014-05-04 00:43:19"),
	(9,  9, "2014-05-04 00:43:19"),
	(9, 17, "2014-05-04 00:43:19"),
	(9, 18, "2014-05-04 00:43:19"),
	(9,  2, "2014-05-04 00:43:19"),
	(10,  3, "2008-01-04 01:35:38"),
	(10, 11, "2008-01-04 01:35:38"),
	(10, 21, "2008-01-04 01:35:38"),
	(10,  9, "2008-01-04 01:35:38"),
	(10,  8, "2008-01-04 01:35:38"),
	(10, 17, "2008-01-04 01:35:38"),
	(10,  6, "2008-01-04 01:35:38"),
	(10, 12, "2008-01-04 01:35:38"),
	(11, 12, "2003-09-06 00:24:30"),
	(11,  7, "2003-09-06 00:24:30"),
	(11, 16, "2003-09-06 00:24:30"),
	(11, 23, "2003-09-06 00:24:30"),
	(11,  6, "2003-09-06 00:24:30"),
	(12,  3, "2001-09-29 23:52:37"),
	(12,  7, "2001-09-29 23:52:37"),
	(12,  9, "2001-09-29 23:52:37"),
	(12, 11, "2001-09-29 23:52:37"),
	(12,  8, "2001-09-29 23:52:37"),
	(12, 22, "2001-09-29 23:52:37"),
	(12, 18, "2001-09-29 23:52:37"),
	(12, 12, "2001-09-29 23:52:37"),
	(13, 12, "2006-09-28 13:40:16"),
	(14, 15, "2023-07-06 08:06:32"),
	(14, 23, "2023-07-06 08:06:32"),
	(14,  9, "2023-07-06 08:06:32"),
	(14, 18, "2023-07-06 08:06:32"),
	(15, 16, "2002-03-06 00:23:57"),
	(16, 17, "2024-07-08 06:14:22"),
	(16, 11, "2024-07-08 06:14:22"),
	(16,  7, "2024-07-08 06:14:22"),
	(17,  9, "2009-03-03 17:07:51"),
	(17, 16, "2009-03-03 17:07:51"),
	(17,  6, "2009-03-03 17:07:51"),
	(17,  8, "2009-03-03 17:07:51"),
	(17, 21, "2009-03-03 17:07:51"),
	(17, 18, "2009-03-03 17:07:51"),
	(18,  7, "2006-06-21 15:10:38"),
	(18,  8, "2006-06-21 15:10:38"),
	(18, 14, "2006-06-21 15:10:38"),
	(18,  6, "2006-06-21 15:10:38"),
	(18, 12, "2006-06-21 15:10:38"),
	(18, 21, "2006-06-21 15:10:38"),
	(18, 20, "2006-06-21 15:10:38"),
	(18, 23, "2006-06-21 15:10:38"),
	(19, 22, "2019-06-13 16:53:20"),
	(19, 21, "2019-06-13 16:53:20"),
	(19,  6, "2019-06-13 16:53:20"),
	(19,  7, "2019-06-13 16:53:20"),
	(19,  8, "2019-06-13 16:53:20"),
	(19, 14, "2019-06-13 16:53:20"),
	(20,  1, "2023-07-12 18:41:27"),
	(20, 21, "2023-07-12 18:41:27"),
	(20,  9, "2023-07-12 18:41:27"),
	(20, 20, "2023-07-12 18:41:27"),
	(21, 11, "2005-01-24 00:18:06"),
	(22,  7, "2011-02-16 02:48:03"),
	(22, 21, "2011-02-16 02:48:03"),
	(23,  9, "2016-06-20 13:40:38"),
	(23, 22, "2016-06-20 13:40:38"),
	(23, 20, "2016-06-20 13:40:38"),
	(23,  1, "2016-06-20 13:40:38"),
	(23, 18, "2016-06-20 13:40:38"),
	(23, 21, "2016-06-20 13:40:38"),
	(23, 12, "2016-06-20 13:40:38"),
	(23,  3, "2016-06-20 13:40:38"),
	(23,  7, "2016-06-20 13:40:38"),
	(23, 23, "2016-06-20 13:40:38"),
	(23, 17, "2016-06-20 13:40:38"),
	(23, 14, "2016-06-20 13:40:38"),
	(24, 14, "2009-05-19 21:53:46"),
	(24, 18, "2009-05-19 21:53:46"),
	(24, 15, "2009-05-19 21:53:46"),
	(25,  3, "2013-04-17 00:15:42"),
	(25,  2, "2013-04-17 00:15:42"),
	(26, 20, "2013-11-11 20:24:12"),
	(26,  6, "2013-11-11 20:24:12"),
	(26, 11, "2013-11-11 20:24:12"),
	(26, 12, "2013-11-11 20:24:12"),
	(26, 22, "2013-11-11 20:24:12"),
	(26, 14, "2013-11-11 20:24:12"),
	(27,  9, "2013-07-18 10:21:24"),
	(27,  6, "2013-07-18 10:21:24"),
	(27, 17, "2013-07-18 10:21:24"),
	(27,  3, "2013-07-18 10:21:24"),
	(28, 11, "2024-01-20 09:03:39"),
	(28, 16, "2024-01-20 09:03:39"),
	(28,  9, "2024-01-20 09:03:39"),
	(28, 22, "2024-01-20 09:03:39"),
	(28,  7, "2024-01-20 09:03:39"),
	(28, 23, "2024-01-20 09:03:39"),
	(28, 12, "2024-01-20 09:03:39"),
	(29,  3, "2012-12-31 23:07:04"),
	(30, 11, "2000-07-14 20:35:22"),
	(30, 21, "2000-07-14 20:35:22"),
	(30, 23, "2000-07-14 20:35:22"),
	(30, 14, "2000-07-14 20:35:22"),
	(30, 16, "2000-07-14 20:35:22"),
	(30,  3, "2000-07-14 20:35:22"),
	(30,  9, "2000-07-14 20:35:22"),
	(30, 18, "2000-07-14 20:35:22"),
	(31, 23, "2006-02-12 02:25:14"),
	(31, 22, "2006-02-12 02:25:14"),
	(31,  9, "2006-02-12 02:25:14"),
	(31,  6, "2006-02-12 02:25:14"),
	(32, 14, "2015-09-20 14:50:46"),
	(32, 12, "2015-09-20 14:50:46"),
	(32, 16, "2015-09-20 14:50:46"),
	(32,  9, "2015-09-20 14:50:46"),
	(32, 20, "2015-09-20 14:50:46"),
	(33,  3, "2012-01-12 03:26:16"),
	(33,  7, "2012-01-12 03:26:16"),
	(33, 16, "2012-01-12 03:26:16"),
	(33,  8, "2012-01-12 03:26:16"),
	(34,  7, "2004-09-30 11:56:02"),
	(34,  2, "2004-09-30 11:56:02"),
	(34,  3, "2004-09-30 11:56:02"),
	(34, 22, "2004-09-30 11:56:02"),
	(35,  2, "2021-07-01 15:33:01"),
	(35, 12, "2021-07-01 15:33:01"),
	(35, 22, "2021-07-01 15:33:01"),
	(35, 14, "2021-07-01 15:33:01"),
	(35,  7, "2021-07-01 15:33:01"),
	(35, 18, "2021-07-01 15:33:01"),
	(36, 14, "2005-08-02 22:01:19"),
	(36, 12, "2005-08-02 22:01:19"),
	(36,  8, "2005-08-02 22:01:19"),
	(36, 11, "2005-08-02 22:01:19"),
	(37, 20, "2006-01-15 18:33:18"),
	(37,  9, "2006-01-15 18:33:18"),
	(37, 12, "2006-01-15 18:33:18"),
	(37,  3, "2006-01-15 18:33:18"),
	(37,  7, "2006-01-15 18:33:18"),
	(37,  8, "2006-01-15 18:33:18"),
	(38,  3, "2017-06-11 21:51:45"),
	(38, 17, "2017-06-11 21:51:45"),
	(38,  8, "2017-06-11 21:51:45"),
	(38, 22, "2017-06-11 21:51:45"),
	(38, 21, "2017-06-11 21:51:45"),
	(38,  1, "2017-06-11 21:51:45"),
	(39,  1, "2000-08-30 05:40:53"),
	(39,  3, "2000-08-30 05:40:53"),
	(39, 22, "2000-08-30 05:40:53"),
	(39, 18, "2000-08-30 05:40:53"),
	(39,  8, "2000-08-30 05:40:53"),
	(39, 15, "2000-08-30 05:40:53"),
	(39, 12, "2000-08-30 05:40:53"),
	(40,  7, "2023-10-07 14:02:44"),
	(40, 17, "2023-10-07 14:02:44"),
	(40, 14, "2023-10-07 14:02:44"),
	(40, 15, "2023-10-07 14:02:44"),
	(40,  1, "2023-10-07 14:02:44"),
	(40, 23, "2023-10-07 14:02:44"),
	(40, 16, "2023-10-07 14:02:44"),
	(40,  2, "2023-10-07 14:02:44"),
	(41, 11, "2020-03-30 12:02:04"),
	(42, 11, "2013-07-31 18:51:07"),
	(42,  8, "2013-07-31 18:51:07"),
	(42, 12, "2013-07-31 18:51:07"),
	(42,  6, "2013-07-31 18:51:07"),
	(42, 23, "2013-07-31 18:51:07"),
	(43, 14, "2009-03-12 07:33:00"),
	(43,  2, "2009-03-12 07:33:00"),
	(43, 21, "2009-03-12 07:33:00"),
	(43,  8, "2009-03-12 07:33:00"),
	(44,  8, "2002-11-28 19:30:39"),
	(44, 17, "2002-11-28 19:30:39"),
	(44, 11, "2002-11-28 19:30:39"),
	(44, 21, "2002-11-28 19:30:39"),
	(45, 18, "2005-09-08 20:38:50"),
	(45, 21, "2005-09-08 20:38:50"),
	(45,  9, "2005-09-08 20:38:50"),
	(45, 11, "2005-09-08 20:38:50"),
	(45, 22, "2005-09-08 20:38:50"),
	(46, 22, "2004-04-26 16:12:15"),
	(46, 14, "2004-04-26 16:12:15"),
	(46,  6, "2004-04-26 16:12:15"),
	(46, 21, "2004-04-26 16:12:15"),
	(47, 12, "2014-12-29 18:54:06"),
	(47, 21, "2014-12-29 18:54:06"),
	(47, 22, "2014-12-29 18:54:06"),
	(47,  1, "2014-12-29 18:54:06"),
	(48, 18, "2006-11-03 04:56:50"),
	(49, 15, "2023-12-30 06:17:47"),
	(49, 14, "2023-12-30 06:17:47"),
	(49, 22, "2023-12-30 06:17:47"),
	(49, 21, "2023-12-30 06:17:47"),
	(49, 18, "2023-12-30 06:17:47"),
	(49,  8, "2023-12-30 06:17:47"),
	(49,  2, "2023-12-30 06:17:47"),
	(49,  7, "2023-12-30 06:17:47"),
	(49, 11, "2023-12-30 06:17:47"),
	(50, 22, "2000-10-13 18:15:16"),
	(50,  7, "2000-10-13 18:15:16"),
	(50, 17, "2000-10-13 18:15:16"),
	(50,  1, "2000-10-13 18:15:16"),
	(50, 20, "2000-10-13 18:15:16"),
	(50,  6, "2000-10-13 18:15:16"),
	(50, 18, "2000-10-13 18:15:16"),
	(50,  2, "2000-10-13 18:15:16"),
	(50, 21, "2000-10-13 18:15:16"),
	(50,  3, "2000-10-13 18:15:16"),
	(50, 12, "2000-10-13 18:15:16"),
	(51, 20, "2023-06-18 16:15:32"),
	(51, 14, "2023-06-18 16:15:32"),
	(51, 11, "2023-06-18 16:15:32"),
	(51,  3, "2023-06-18 16:15:32"),
	(51, 16, "2023-06-18 16:15:32"),
	(51,  1, "2023-06-18 16:15:32"),
	(52, 11, "2005-05-06 16:18:38"),
	(52, 20, "2005-05-06 16:18:38"),
	(52, 14, "2005-05-06 16:18:38"),
	(52, 23, "2005-05-06 16:18:38"),
	(52,  8, "2005-05-06 16:18:38"),
	(53, 14, "2003-01-22 18:04:16"),
	(53, 16, "2003-01-22 18:04:16"),
	(53,  1, "2003-01-22 18:04:16"),
	(53,  3, "2003-01-22 18:04:16"),
	(53, 22, "2003-01-22 18:04:16"),
	(53,  6, "2003-01-22 18:04:16"),
	(53, 12, "2003-01-22 18:04:16"),
	(53,  8, "2003-01-22 18:04:16"),
	(54,  6, "2012-01-03 21:12:59"),
	(54, 12, "2012-01-03 21:12:59"),
	(54, 11, "2012-01-03 21:12:59"),
	(54,  9, "2012-01-03 21:12:59"),
	(54, 21, "2012-01-03 21:12:59"),
	(55,  2, "2002-08-08 13:25:50"),
	(55, 17, "2002-08-08 13:25:50"),
	(55, 14, "2002-08-08 13:25:50"),
	(56,  6, "2011-04-06 20:55:29"),
	(56, 16, "2011-04-06 20:55:29"),
	(56,  9, "2011-04-06 20:55:29"),
	(56, 23, "2011-04-06 20:55:29"),
	(56,  7, "2011-04-06 20:55:29"),
	(56,  8, "2011-04-06 20:55:29"),
	(57, 15, "2008-04-22 13:17:23"),
	(57,  9, "2008-04-22 13:17:23"),
	(57, 11, "2008-04-22 13:17:23"),
	(57, 17, "2008-04-22 13:17:23"),
	(58, 12, "2002-05-19 21:28:52"),
	(58,  7, "2002-05-19 21:28:52"),
	(58, 18, "2002-05-19 21:28:52"),
	(58, 21, "2002-05-19 21:28:52"),
	(58, 20, "2002-05-19 21:28:52"),
	(58,  2, "2002-05-19 21:28:52"),
	(58, 11, "2002-05-19 21:28:52"),
	(58,  6, "2002-05-19 21:28:52"),
	(59, 17, "2009-12-08 11:01:37"),
	(59, 21, "2009-12-08 11:01:37"),
	(59,  8, "2009-12-08 11:01:37"),
	(59, 18, "2009-12-08 11:01:37"),
	(59,  1, "2009-12-08 11:01:37"),
	(59, 14, "2009-12-08 11:01:37"),
	(59,  9, "2009-12-08 11:01:37"),
	(59,  2, "2009-12-08 11:01:37"),
	(60,  2, "2011-08-01 13:03:00"),
	(60, 16, "2011-08-01 13:03:00"),
	(61,  1, "2007-01-26 21:04:05"),
	(61,  6, "2007-01-26 21:04:05"),
	(61, 11, "2007-01-26 21:04:05"),
	(61, 14, "2007-01-26 21:04:05"),
	(61, 12, "2007-01-26 21:04:05"),
	(61, 23, "2007-01-26 21:04:05"),
	(61, 17, "2007-01-26 21:04:05"),
	(62, 20, "2005-07-23 13:32:01"),
	(62, 18, "2005-07-23 13:32:01"),
	(62, 22, "2005-07-23 13:32:01"),
	(62, 16, "2005-07-23 13:32:01"),
	(62, 12, "2005-07-23 13:32:01"),
	(62,  8, "2005-07-23 13:32:01"),
	(63, 21, "2024-03-06 06:07:30"),
	(63, 12, "2024-03-06 06:07:30"),
	(63, 22, "2024-03-06 06:07:30"),
	(63, 16, "2024-03-06 06:07:30"),
	(63, 23, "2024-03-06 06:07:30"),
	(64, 14, "2020-08-31 21:09:45"),
	(64, 17, "2020-08-31 21:09:45"),
	(65,  7, "2008-03-15 11:46:09"),
	(66,  3, "2019-06-16 15:49:34"),
	(66,  6, "2019-06-16 15:49:34"),
	(66,  1, "2019-06-16 15:49:34"),
	(66, 22, "2019-06-16 15:49:34"),
	(67, 22, "2007-07-08 09:24:24"),
	(67, 23, "2007-07-08 09:24:24"),
	(67, 11, "2007-07-08 09:24:24"),
	(67, 21, "2007-07-08 09:24:24"),
	(67,  9, "2007-07-08 09:24:24"),
	(67,  6, "2007-07-08 09:24:24"),
	(68, 21, "2021-08-24 22:23:21"),
	(68,  6, "2021-08-24 22:23:21"),
	(68,  8, "2021-08-24 22:23:21"),
	(68, 15, "2021-08-24 22:23:21"),
	(68,  2, "2021-08-24 22:23:21"),
	(68, 12, "2021-08-24 22:23:21"),
	(68, 17, "2021-08-24 22:23:21"),
	(68, 18, "2021-08-24 22:23:21"),
	(68, 16, "2021-08-24 22:23:21"),
	(69, 15, "2002-04-08 19:16:00"),
	(69, 23, "2002-04-08 19:16:00"),
	(69,  7, "2002-04-08 19:16:00"),
	(69, 14, "2002-04-08 19:16:00"),
	(69,  1, "2002-04-08 19:16:00"),
	(69, 22, "2002-04-08 19:16:00"),
	(69,  8, "2002-04-08 19:16:00"),
	(69, 21, "2002-04-08 19:16:00"),
	(69, 16, "2002-04-08 19:16:00"),
	(70,  6, "2016-10-02 20:05:37"),
	(70,  9, "2016-10-02 20:05:37"),
	(70, 20, "2016-10-02 20:05:37"),
	(70,  7, "2016-10-02 20:05:37"),
	(71, 11, "2011-12-09 00:44:41"),
	(71,  3, "2011-12-09 00:44:41"),
	(72,  8, "2015-05-12 05:43:16"),
	(72, 17, "2015-05-12 05:43:16"),
	(72, 23, "2015-05-12 05:43:16"),
	(72,  1, "2015-05-12 05:43:16"),
	(72, 20, "2015-05-12 05:43:16"),
	(72, 15, "2015-05-12 05:43:16"),
	(72,  7, "2015-05-12 05:43:16"),
	(72,  6, "2015-05-12 05:43:16"),
	(72,  2, "2015-05-12 05:43:16"),
	(72,  3, "2015-05-12 05:43:16"),
	(73, 14, "2003-01-25 18:30:46"),
	(74,  2, "2023-06-29 23:44:40"),
	(74,  6, "2023-06-29 23:44:40"),
	(74, 23, "2023-06-29 23:44:40"),
	(74, 20, "2023-06-29 23:44:40"),
	(74, 14, "2023-06-29 23:44:40"),
	(74,  3, "2023-06-29 23:44:40"),
	(74,  1, "2023-06-29 23:44:40"),
	(75, 23, "2001-01-23 09:11:10"),
	(75,  7, "2001-01-23 09:11:10"),
	(75,  3, "2001-01-23 09:11:10"),
	(76, 20, "2007-12-25 23:25:14"),
	(76, 18, "2007-12-25 23:25:14"),
	(76, 14, "2007-12-25 23:25:14"),
	(76,  2, "2007-12-25 23:25:14"),
	(76, 23, "2007-12-25 23:25:14"),
	(76, 17, "2007-12-25 23:25:14"),
	(76,  1, "2007-12-25 23:25:14"),
	(76,  8, "2007-12-25 23:25:14"),
	(77, 21, "2011-03-15 10:07:22"),
	(77, 16, "2011-03-15 10:07:22"),
	(77,  3, "2011-03-15 10:07:22"),
	(77,  7, "2011-03-15 10:07:22"),
	(77, 17, "2011-03-15 10:07:22"),
	(77,  8, "2011-03-15 10:07:22"),
	(77,  6, "2011-03-15 10:07:22"),
	(77, 14, "2011-03-15 10:07:22"),
	(77,  1, "2011-03-15 10:07:22"),
	(77,  2, "2011-03-15 10:07:22"),
	(78, 21, "2018-09-05 10:08:40"),
	(78, 15, "2018-09-05 10:08:40"),
	(78,  2, "2018-09-05 10:08:40"),
	(78, 16, "2018-09-05 10:08:40"),
	(78,  8, "2018-09-05 10:08:40"),
	(78,  1, "2018-09-05 10:08:40"),
	(78,  9, "2018-09-05 10:08:40"),
	(78, 22, "2018-09-05 10:08:40"),
	(79, 20, "2022-04-13 21:02:04"),
	(79,  6, "2022-04-13 21:02:04"),
	(79, 21, "2022-04-13 21:02:04"),
	(79, 22, "2022-04-13 21:02:04"),
	(79,  9, "2022-04-13 21:02:04"),
	(79,  2, "2022-04-13 21:02:04"),
	(79, 23, "2022-04-13 21:02:04"),
	(80, 14, "2021-09-16 12:58:35"),
	(80,  1, "2021-09-16 12:58:35"),
	(80, 22, "2021-09-16 12:58:35"),
	(80, 15, "2021-09-16 12:58:35"),
	(80, 16, "2021-09-16 12:58:35"),
	(80, 12, "2021-09-16 12:58:35"),
	(81,  8, "2017-07-08 01:23:17"),
	(81, 12, "2017-07-08 01:23:17"),
	(81, 18, "2017-07-08 01:23:17"),
	(81, 22, "2017-07-08 01:23:17"),
	(81, 16, "2017-07-08 01:23:17"),
	(81, 20, "2017-07-08 01:23:17"),
	(81, 15, "2017-07-08 01:23:17"),
	(81, 11, "2017-07-08 01:23:17"),
	(82,  2, "2020-03-04 15:24:19"),
	(82, 17, "2020-03-04 15:24:19"),
	(82, 22, "2020-03-04 15:24:19"),
	(83, 11, "2018-08-07 16:17:16"),
	(83, 18, "2018-08-07 16:17:16"),
	(83,  7, "2018-08-07 16:17:16"),
	(83,  9, "2018-08-07 16:17:16"),
	(83, 14, "2018-08-07 16:17:16"),
	(83, 21, "2018-08-07 16:17:16"),
	(83,  2, "2018-08-07 16:17:16"),
	(83, 22, "2018-08-07 16:17:16"),
	(83, 17, "2018-08-07 16:17:16"),
	(83, 23, "2018-08-07 16:17:16"),
	(83,  1, "2018-08-07 16:17:16"),
	(84, 22, "2018-09-30 17:11:52"),
	(84,  1, "2018-09-30 17:11:52"),
	(84, 16, "2018-09-30 17:11:52"),
	(84,  6, "2018-09-30 17:11:52"),
	(84, 20, "2018-09-30 17:11:52"),
	(84, 12, "2018-09-30 17:11:52"),
	(84, 21, "2018-09-30 17:11:52"),
	(84,  2, "2018-09-30 17:11:52"),
	(84, 15, "2018-09-30 17:11:52"),
	(85,  6, "2005-12-01 19:22:35"),
	(86,  8, "2013-03-10 07:31:49"),
	(86, 18, "2013-03-10 07:31:49"),
	(86, 21, "2013-03-10 07:31:49"),
	(86, 11, "2013-03-10 07:31:49"),
	(86,  1, "2013-03-10 07:31:49"),
	(87, 15, "2013-05-13 10:34:25"),
	(87, 22, "2013-05-13 10:34:25"),
	(87,  8, "2013-05-13 10:34:25"),
	(87,  2, "2013-05-13 10:34:25"),
	(87,  1, "2013-05-13 10:34:25"),
	(88, 16, "2004-06-17 22:03:47"),
	(88,  1, "2004-06-17 22:03:47"),
	(88, 14, "2004-06-17 22:03:47"),
	(89,  1, "2021-09-16 09:10:35"),
	(90, 11, "2023-02-13 20:20:54"),
	(90, 18, "2023-02-13 20:20:54"),
	(90, 22, "2023-02-13 20:20:54"),
	(90,  1, "2023-02-13 20:20:54"),
	(91, 20, "2008-04-15 04:53:19"),
	(91, 21, "2008-04-15 04:53:19"),
	(91, 22, "2008-04-15 04:53:19"),
	(91,  1, "2008-04-15 04:53:19"),
	(91,  6, "2008-04-15 04:53:19"),
	(91,  8, "2008-04-15 04:53:19"),
	(92, 17, "2011-10-12 12:29:38"),
	(92, 22, "2011-10-12 12:29:38"),
	(92, 16, "2011-10-12 12:29:38"),
	(92,  2, "2011-10-12 12:29:38"),
	(92,  7, "2011-10-12 12:29:38"),
	(92,  1, "2011-10-12 12:29:38"),
	(92, 23, "2011-10-12 12:29:38"),
	(93, 22, "2012-06-14 02:45:27"),
	(93,  9, "2012-06-14 02:45:27"),
	(93,  2, "2012-06-14 02:45:27"),
	(93,  7, "2012-06-14 02:45:27"),
	(93, 23, "2012-06-14 02:45:27"),
	(93, 11, "2012-06-14 02:45:27"),
	(94, 23, "2016-02-03 00:00:50"),
	(94, 18, "2016-02-03 00:00:50"),
	(94, 14, "2016-02-03 00:00:50"),
	(94, 12, "2016-02-03 00:00:50"),
	(94, 15, "2016-02-03 00:00:50"),
	(94, 20, "2016-02-03 00:00:50"),
	(94,  3, "2016-02-03 00:00:50"),
	(94, 17, "2016-02-03 00:00:50"),
	(94,  2, "2016-02-03 00:00:50"),
	(95, 17, "2006-09-16 04:13:51"),
	(95, 11, "2006-09-16 04:13:51"),
	(95, 16, "2006-09-16 04:13:51"),
	(95,  2, "2006-09-16 04:13:51"),
	(95, 21, "2006-09-16 04:13:51"),
	(95,  3, "2006-09-16 04:13:51"),
	(95, 12, "2006-09-16 04:13:51"),
	(95, 20, "2006-09-16 04:13:51"),
	(95,  1, "2006-09-16 04:13:51"),
	(95,  8, "2006-09-16 04:13:51"),
	(95, 22, "2006-09-16 04:13:51"),
	(96,  6, "2016-11-07 12:59:31"),
	(97,  3, "2024-05-07 19:17:45"),
	(97, 23, "2024-05-07 19:17:45"),
	(98,  7, "2008-05-27 11:48:52"),
	(98, 18, "2008-05-27 11:48:52"),
	(98,  6, "2008-05-27 11:48:52"),
	(98, 16, "2008-05-27 11:48:52"),
	(99, 20, "2003-06-01 17:45:16"),
	(99, 17, "2003-06-01 17:45:16"),
	(99,  1, "2003-06-01 17:45:16"),
	(99,  9, "2003-06-01 17:45:16"),
	(99, 12, "2003-06-01 17:45:16"),
	(99, 11, "2003-06-01 17:45:16"),
	(99, 22, "2003-06-01 17:45:16"),
	(100, 15, "2014-10-07 16:23:35"),
	(100, 11, "2014-10-07 16:23:35"),
	(100,  2, "2014-10-07 16:23:35"),
	(100,  6, "2014-10-07 16:23:35"),
	(100, 16, "2014-10-07 16:23:35"),
	(100, 21, "2014-10-07 16:23:35"),
	(100, 23, "2014-10-07 16:23:35"),
	(101, 20, "2006-09-20 18:31:40"),
	(101, 15, "2006-09-20 18:31:40"),
	(101,  6, "2006-09-20 18:31:40"),
	(101, 18, "2006-09-20 18:31:40"),
	(101, 14, "2006-09-20 18:31:40"),
	(101,  9, "2006-09-20 18:31:40"),
	(101,  8, "2006-09-20 18:31:40"),
	(101, 16, "2006-09-20 18:31:40"),
	(101, 23, "2006-09-20 18:31:40"),
	(102,  9, "2002-08-12 06:25:15"),
	(102, 14, "2002-08-12 06:25:15"),
	(102,  1, "2002-08-12 06:25:15"),
	(102,  3, "2002-08-12 06:25:15"),
	(102, 17, "2002-08-12 06:25:15"),
	(103, 15, "2023-08-10 23:08:08"),
	(103, 16, "2023-08-10 23:08:08"),
	(103,  3, "2023-08-10 23:08:08"),
	(103, 12, "2023-08-10 23:08:08"),
	(104, 11, "2003-01-05 15:28:47"),
	(104, 20, "2003-01-05 15:28:47"),
	(104,  7, "2003-01-05 15:28:47"),
	(104, 17, "2003-01-05 15:28:47"),
	(105,  9, "2010-10-13 00:58:15"),
	(105, 17, "2010-10-13 00:58:15"),
	(105,  1, "2010-10-13 00:58:15"),
	(105, 11, "2010-10-13 00:58:15"),
	(105,  6, "2010-10-13 00:58:15"),
	(105, 18, "2010-10-13 00:58:15"),
	(105, 15, "2010-10-13 00:58:15"),
	(105, 14, "2010-10-13 00:58:15"),
	(105, 20, "2010-10-13 00:58:15"),
	(106,  7, "2002-10-13 11:10:48"),
	(107,  9, "2003-01-16 05:32:36"),
	(107, 23, "2003-01-16 05:32:36"),
	(107, 14, "2003-01-16 05:32:36"),
	(107, 11, "2003-01-16 05:32:36"),
	(107, 15, "2003-01-16 05:32:36"),
	(107, 20, "2003-01-16 05:32:36"),
	(107, 12, "2003-01-16 05:32:36"),
	(107, 18, "2003-01-16 05:32:36"),
	(107,  6, "2003-01-16 05:32:36"),
	(108, 21, "2006-07-30 11:19:50"),
	(108, 16, "2006-07-30 11:19:50"),
	(108, 12, "2006-07-30 11:19:50"),
	(108, 17, "2006-07-30 11:19:50"),
	(108,  6, "2006-07-30 11:19:50"),
	(108,  3, "2006-07-30 11:19:50"),
	(108,  7, "2006-07-30 11:19:50"),
	(108, 11, "2006-07-30 11:19:50"),
	(108, 20, "2006-07-30 11:19:50"),
	(109, 15, "2013-10-10 02:15:41"),
	(109, 17, "2013-10-10 02:15:41"),
	(109,  2, "2013-10-10 02:15:41"),
	(109, 16, "2013-10-10 02:15:41"),
	(109,  1, "2013-10-10 02:15:41"),
	(109, 12, "2013-10-10 02:15:41"),
	(109,  9, "2013-10-10 02:15:41"),
	(109,  6, "2013-10-10 02:15:41"),
	(110,  7, "2018-10-30 22:22:31"),
	(110, 20, "2018-10-30 22:22:31"),
	(110, 17, "2018-10-30 22:22:31"),
	(110, 21, "2018-10-30 22:22:31"),
	(110,  9, "2018-10-30 22:22:31"),
	(110, 12, "2018-10-30 22:22:31"),
	(110,  8, "2018-10-30 22:22:31"),
	(110, 23, "2018-10-30 22:22:31"),
	(111, 12, "2010-03-10 11:11:56"),
	(111,  9, "2010-03-10 11:11:56"),
	(111, 11, "2010-03-10 11:11:56"),
	(111,  1, "2010-03-10 11:11:56"),
	(111, 14, "2010-03-10 11:11:56"),
	(111,  6, "2010-03-10 11:11:56"),
	(112,  7, "2004-03-06 21:59:12"),
	(112, 21, "2004-03-06 21:59:12"),
	(113, 23, "2016-06-25 10:00:24"),
	(113, 17, "2016-06-25 10:00:24"),
	(113,  3, "2016-06-25 10:00:24"),
	(113,  6, "2016-06-25 10:00:24"),
	(113, 11, "2016-06-25 10:00:24"),
	(113,  2, "2016-06-25 10:00:24"),
	(113, 15, "2016-06-25 10:00:24"),
	(114, 23, "2007-09-15 03:58:24"),
	(114, 14, "2007-09-15 03:58:24"),
	(114,  2, "2007-09-15 03:58:24"),
	(114,  3, "2007-09-15 03:58:24"),
	(114, 11, "2007-09-15 03:58:24"),
	(114,  6, "2007-09-15 03:58:24"),
	(115,  1, "2022-11-29 16:16:36"),
	(115, 22, "2022-11-29 16:16:36"),
	(115, 17, "2022-11-29 16:16:36"),
	(115,  9, "2022-11-29 16:16:36"),
	(116,  3, "2020-04-06 02:19:25"),
	(116, 15, "2020-04-06 02:19:25"),
	(116, 16, "2020-04-06 02:19:25"),
	(116, 23, "2020-04-06 02:19:25"),
	(116,  1, "2020-04-06 02:19:25"),
	(116, 11, "2020-04-06 02:19:25"),
	(116, 17, "2020-04-06 02:19:25"),
	(116, 14, "2020-04-06 02:19:25"),
	(116, 22, "2020-04-06 02:19:25"),
	(117, 15, "2009-04-04 20:15:47"),
	(117, 17, "2009-04-04 20:15:47"),
	(117,  3, "2009-04-04 20:15:47"),
	(118,  2, "2003-09-17 01:02:31"),
	(118, 22, "2003-09-17 01:02:31"),
	(118,  9, "2003-09-17 01:02:31"),
	(118, 21, "2003-09-17 01:02:31"),
	(118, 16, "2003-09-17 01:02:31"),
	(118, 23, "2003-09-17 01:02:31"),
	(118, 17, "2003-09-17 01:02:31"),
	(118,  6, "2003-09-17 01:02:31"),
	(118,  3, "2003-09-17 01:02:31"),
	(118,  1, "2003-09-17 01:02:31"),
	(119, 17, "2005-07-17 21:57:09"),
	(119, 18, "2005-07-17 21:57:09"),
	(120,  6, "2011-09-12 15:50:50"),
	(120,  9, "2011-09-12 15:50:50"),
	(120, 23, "2011-09-12 15:50:50"),
	(120, 22, "2011-09-12 15:50:50"),
	(121, 11, "2022-05-11 09:44:43"),
	(121,  8, "2022-05-11 09:44:43"),
	(121,  2, "2022-05-11 09:44:43"),
	(121, 21, "2022-05-11 09:44:43"),
	(121, 16, "2022-05-11 09:44:43"),
	(121, 23, "2022-05-11 09:44:43"),
	(121,  6, "2022-05-11 09:44:43"),
	(121,  7, "2022-05-11 09:44:43"),
	(121,  1, "2022-05-11 09:44:43"),
	(122, 16, "2020-04-09 09:37:26"),
	(122,  2, "2020-04-09 09:37:26"),
	(122,  1, "2020-04-09 09:37:26"),
	(122, 11, "2020-04-09 09:37:26"),
	(122, 20, "2020-04-09 09:37:26"),
	(122, 12, "2020-04-09 09:37:26"),
	(122, 18, "2020-04-09 09:37:26"),
	(123, 23, "2021-01-20 03:24:45"),
	(123,  7, "2021-01-20 03:24:45"),
	(123,  2, "2021-01-20 03:24:45"),
	(123, 11, "2021-01-20 03:24:45"),
	(123, 16, "2021-01-20 03:24:45"),
	(123,  8, "2021-01-20 03:24:45"),
	(123, 14, "2021-01-20 03:24:45"),
	(123, 18, "2021-01-20 03:24:45"),
	(123, 21, "2021-01-20 03:24:45"),
	(123, 15, "2021-01-20 03:24:45"),
	(123,  6, "2021-01-20 03:24:45"),
	(124, 20, "2006-06-05 23:16:58"),
	(125,  3, "2004-02-20 20:21:58"),
	(125,  7, "2004-02-20 20:21:58"),
	(125,  1, "2004-02-20 20:21:58"),
	(125, 18, "2004-02-20 20:21:58"),
	(125, 17, "2004-02-20 20:21:58"),
	(125, 22, "2004-02-20 20:21:58"),
	(125, 23, "2004-02-20 20:21:58"),
	(125,  2, "2004-02-20 20:21:58"),
	(125,  9, "2004-02-20 20:21:58"),
	(126,  2, "2018-03-18 11:40:17"),
	(126, 18, "2018-03-18 11:40:17"),
	(126,  8, "2018-03-18 11:40:17"),
	(126,  3, "2018-03-18 11:40:17"),
	(126, 15, "2018-03-18 11:40:17"),
	(126, 16, "2018-03-18 11:40:17"),
	(126, 21, "2018-03-18 11:40:17"),
	(126, 14, "2018-03-18 11:40:17"),
	(126, 17, "2018-03-18 11:40:17"),
	(126, 11, "2018-03-18 11:40:17"),
	(127, 20, "2017-03-12 18:46:50"),
	(127, 17, "2017-03-12 18:46:50"),
	(127, 14, "2017-03-12 18:46:50"),
	(127, 15, "2017-03-12 18:46:50"),
	(127, 23, "2017-03-12 18:46:50"),
	(127,  6, "2017-03-12 18:46:50"),
	(127,  1, "2017-03-12 18:46:50"),
	(127, 12, "2017-03-12 18:46:50"),
	(128, 15, "2005-03-31 10:21:21"),
	(128,  1, "2005-03-31 10:21:21"),
	(128, 18, "2005-03-31 10:21:21"),
	(128, 22, "2005-03-31 10:21:21"),
	(129, 23, "2010-01-28 02:53:17"),
	(129,  7, "2010-01-28 02:53:17"),
	(129, 12, "2010-01-28 02:53:17"),
	(129, 18, "2010-01-28 02:53:17"),
	(129,  8, "2010-01-28 02:53:17"),
	(129,  2, "2010-01-28 02:53:17"),
	(130, 21, "2010-05-01 12:27:50"),
	(130, 11, "2010-05-01 12:27:50"),
	(131,  3, "2018-10-19 21:09:48"),
	(131,  9, "2018-10-19 21:09:48"),
	(131, 11, "2018-10-19 21:09:48"),
	(131, 16, "2018-10-19 21:09:48"),
	(131, 15, "2018-10-19 21:09:48"),
	(132, 20, "2006-11-24 01:19:26"),
	(132,  8, "2006-11-24 01:19:26"),
	(132,  2, "2006-11-24 01:19:26"),
	(132,  7, "2006-11-24 01:19:26"),
	(132, 21, "2006-11-24 01:19:26"),
	(132, 18, "2006-11-24 01:19:26"),
	(132,  1, "2006-11-24 01:19:26"),
	(132,  3, "2006-11-24 01:19:26"),
	(132, 11, "2006-11-24 01:19:26"),
	(132,  6, "2006-11-24 01:19:26"),
	(132,  9, "2006-11-24 01:19:26"),
	(133, 18, "2017-07-13 13:51:41"),
	(133, 12, "2017-07-13 13:51:41"),
	(133,  3, "2017-07-13 13:51:41"),
	(133,  6, "2017-07-13 13:51:41"),
	(133,  7, "2017-07-13 13:51:41"),
	(133,  2, "2017-07-13 13:51:41"),
	(133, 15, "2017-07-13 13:51:41"),
	(133,  8, "2017-07-13 13:51:41"),
	(134, 15, "2014-12-21 10:05:20"),
	(134, 17, "2014-12-21 10:05:20"),
	(134, 12, "2014-12-21 10:05:20"),
	(134,  1, "2014-12-21 10:05:20"),
	(134, 20, "2014-12-21 10:05:20"),
	(134, 14, "2014-12-21 10:05:20"),
	(135,  9, "2017-02-01 23:23:09"),
	(135, 12, "2017-02-01 23:23:09"),
	(135,  2, "2017-02-01 23:23:09"),
	(135,  3, "2017-02-01 23:23:09"),
	(135,  1, "2017-02-01 23:23:09"),
	(135, 16, "2017-02-01 23:23:09"),
	(135, 17, "2017-02-01 23:23:09"),
	(135,  8, "2017-02-01 23:23:09"),
	(136, 22, "2007-08-03 05:45:22"),
	(136, 12, "2007-08-03 05:45:22"),
	(136,  6, "2007-08-03 05:45:22"),
	(136,  8, "2007-08-03 05:45:22"),
	(136, 16, "2007-08-03 05:45:22"),
	(136, 21, "2007-08-03 05:45:22"),
	(136,  2, "2007-08-03 05:45:22"),
	(136,  3, "2007-08-03 05:45:22"),
	(137, 18, "2003-03-26 21:05:49"),
	(137,  3, "2003-03-26 21:05:49"),
	(137,  9, "2003-03-26 21:05:49"),
	(137,  2, "2003-03-26 21:05:49"),
	(137, 22, "2003-03-26 21:05:49"),
	(137,  6, "2003-03-26 21:05:49"),
	(138, 16, "2019-11-17 14:54:32"),
	(138,  1, "2019-11-17 14:54:32"),
	(139, 18, "2016-09-06 10:19:33"),
	(139, 15, "2016-09-06 10:19:33"),
	(139,  9, "2016-09-06 10:19:33"),
	(139,  8, "2016-09-06 10:19:33"),
	(139, 12, "2016-09-06 10:19:33"),
	(139,  6, "2016-09-06 10:19:33"),
	(139, 17, "2016-09-06 10:19:33"),
	(139,  2, "2016-09-06 10:19:33"),
	(140,  1, "2013-01-20 02:21:15"),
	(140, 12, "2013-01-20 02:21:15"),
	(140, 16, "2013-01-20 02:21:15"),
	(140, 22, "2013-01-20 02:21:15"),
	(140, 20, "2013-01-20 02:21:15"),
	(140, 15, "2013-01-20 02:21:15"),
	(141, 18, "2003-11-18 10:53:20"),
	(141, 15, "2003-11-18 10:53:20"),
	(141,  6, "2003-11-18 10:53:20"),
	(141, 20, "2003-11-18 10:53:20"),
	(141, 22, "2003-11-18 10:53:20"),
	(141,  8, "2003-11-18 10:53:20"),
	(142, 15, "2002-02-13 14:03:38"),
	(142, 12, "2002-02-13 14:03:38"),
	(142, 14, "2002-02-13 14:03:38"),
	(142, 16, "2002-02-13 14:03:38"),
	(143, 23, "2013-07-20 08:32:29"),
	(143,  2, "2013-07-20 08:32:29"),
	(143,  6, "2013-07-20 08:32:29"),
	(143,  1, "2013-07-20 08:32:29"),
	(143, 18, "2013-07-20 08:32:29"),
	(144, 22, "2000-10-26 16:58:42"),
	(144, 18, "2000-10-26 16:58:42"),
	(144,  6, "2000-10-26 16:58:42"),
	(144,  2, "2000-10-26 16:58:42"),
	(144,  7, "2000-10-26 16:58:42"),
	(144, 16, "2000-10-26 16:58:42"),
	(144, 14, "2000-10-26 16:58:42"),
	(144, 23, "2000-10-26 16:58:42"),
	(144,  3, "2000-10-26 16:58:42"),
	(144, 20, "2000-10-26 16:58:42"),
	(144,  1, "2000-10-26 16:58:42"),
	(145, 12, "2017-05-19 09:48:21"),
	(145,  1, "2017-05-19 09:48:21"),
	(145, 16, "2017-05-19 09:48:21"),
	(145, 17, "2017-05-19 09:48:21"),
	(146,  2, "2024-03-09 12:23:12"),
	(146,  7, "2024-03-09 12:23:12"),
	(146, 17, "2024-03-09 12:23:12"),
	(146, 12, "2024-03-09 12:23:12"),
	(146, 20, "2024-03-09 12:23:12"),
	(146, 21, "2024-03-09 12:23:12"),
	(146,  8, "2024-03-09 12:23:12"),
	(146, 18, "2024-03-09 12:23:12"),
	(147, 14, "2009-04-06 11:46:39"),
	(147, 20, "2009-04-06 11:46:39"),
	(147, 16, "2009-04-06 11:46:39"),
	(148,  3, "2006-12-08 08:10:16"),
	(148, 22, "2006-12-08 08:10:16"),
	(148,  1, "2006-12-08 08:10:16"),
	(148, 14, "2006-12-08 08:10:16"),
	(148,  9, "2006-12-08 08:10:16"),
	(148, 15, "2006-12-08 08:10:16"),
	(148, 16, "2006-12-08 08:10:16"),
	(149,  8, "2000-08-24 08:33:45"),
	(149, 15, "2000-08-24 08:33:45"),
	(149, 20, "2000-08-24 08:33:45"),
	(149,  3, "2000-08-24 08:33:45"),
	(149, 17, "2000-08-24 08:33:45"),
	(149, 12, "2000-08-24 08:33:45"),
	(149, 11, "2000-08-24 08:33:45"),
	(149, 16, "2000-08-24 08:33:45"),
	(149,  1, "2000-08-24 08:33:45"),
	(149, 21, "2000-08-24 08:33:45"),
	(150,  8, "2007-09-14 23:35:39"),
	(150,  9, "2007-09-14 23:35:39"),
	(150, 21, "2007-09-14 23:35:39"),
	(150, 18, "2007-09-14 23:35:39"),
	(150, 17, "2007-09-14 23:35:39"),
	(150, 14, "2007-09-14 23:35:39"),
	(150, 20, "2007-09-14 23:35:39"),
	(150,  2, "2007-09-14 23:35:39"),
	(150, 23, "2007-09-14 23:35:39"),
	(150,  1, "2007-09-14 23:35:39");