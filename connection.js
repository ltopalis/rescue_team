import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

export async function getUser(username, password) {
    const user = await db.query(`
    SELECT * 
    FROM USERS JOIN 
        LOCATIONS ON USERS.USERNAME = LOCATIONS.USER
    WHERE USERNAME = ? AND PASSWORD = ?
    `, [username, password]);

    return user[0];
}

export async function getWarehouseLocation() {
    const [location] = await db.query(`
        SELECT LONGTITUDE, LATITUDE 
        FROM LOCATIONS 
        WHERE USER = 'ADMIN';`);

    return location[0];
}

export async function signup(username, password, name, role, lat, lng) {
    try {
        const query = `CALL ADD_USER(?,?,?,?,?,?)`;

        await db.execute(query, [username, password, name, role, lat, lng]);

        return { status: "SUCCESS" }

    } catch (error) {
        return { status: error.code }
    }
}

/////////////////////////////////////////////////
///////////////////// ADMIN /////////////////////
/////////////////////////////////////////////////

export async function getProducts() {
    const query = `SELECT PRODUCTS.ID, PRODUCT_NAME, CATEGORY, DETAIL_NAME, DETAIL_VALUE, AMOUNT, DISCONTINUED
FROM PRODUCTS 
	JOIN CATEGORIES ON PRODUCTS.CATEGORY = CATEGORIES.CATEGORY_NAME
    LEFT JOIN DETAILS_OF_PRODUCTS ON DETAILS_OF_PRODUCTS.PRODUCT = PRODUCTS.ID
    JOIN WAREHOUSE ON WAREHOUSE.PRODUCT = PRODUCTS.ID`;

    const [products] = await db.query(query);

    return products;
}

export async function alterAvailabilityProduct(id, discontinued) {
    const query = `UPDATE PRODUCTS SET DISCONTINUED = ? WHERE PRODUCTS.ID = ?`;

    const result = db.query(query, [discontinued, id]);

    return result;
}

export async function getProductCategories() {
    const result = db.query(`
        SELECT * 
        FROM CATEGORIES`);

    return result;
}

export async function addCategory(category) {

    try {
        const query = "INSERT INTO CATEGORIES VALUES (?)";

        await db.query(query, [category]);

        return { status: "SUCCESS" };
    } catch (error) {
        return { status: error.code };
    }

}

export async function addProduct(products) {

    console.log("PRODUCTS: ")
    console.log(products)

    const query = "CALL ADD_NEW_PRODUCT2(?, ?, ?, ?)";

    try {

        for (let prod of products) {
            let name = prod.name;
            let category = prod.category;
            let details = prod.details;

            for (let detail of details)
                await db.query(query, [category, name, detail.detail_name, detail.detail_value]);
        }

        return { status: "SUCCESS" };

    } catch (error) {
        return { status: error.code };
    }

}

export async function updateProductAmount(prod_id, amount) {
    const response = await db.query(`
        UPDATE WAREHOUSE
        SET AMOUNT = ? 
        WHERE WAREHOUSE.PRODUCT = ?`, [amount, prod_id]);

    return response;
}
