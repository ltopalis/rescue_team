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


-- ADD LOAD
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (1, 5, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (5, 4, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (6, 9, '6945384502');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (7, 10, '6945384502');

INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (2, 1, '6925874523');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (4, 3, '6925874523');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (6, 5, '6925874523');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (8, 7, '6925874523');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (10, 9, '6925874523');

INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (5, 4, '6952486520');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (7, 6, '6952486520');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (9, 8, '6952486520');
INSERT INTO VAN_LOAD(product, amount, rescuer) VALUES (11, 10, '6952486520');