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

export async function updatePosition(username, position) {
    const { response } = await db.query(`
        UPDATE LOCATIONS 
        SET LONGTITUDE = ?, LATITUDE = ?
        WHERE USER = ?`, [position.lng, position.lat, username]);

    return response;
}

export async function signup(username, password, name, role, lat, lng) {
    try {
        const query = `CALL ADD_USER(?,?,?,?,?,?,?)`;

        await db.execute(query, [username, password, name, role, (role === "RESCUER" ? 0 : null), lng, lat]);

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

/////////////////////////////////////////////////
//////////////////// RESCUER ////////////////////
/////////////////////////////////////////////////

export async function initRescuer(username) {
    let data = {};

    let [response] = await db.query(`
        SELECT LONGTITUDE, LATITUDE
        FROM LOCATIONS
        WHERE USER = ?`, [username]);

    data.myPos = { lat: response[0].LATITUDE, lng: response[0].LONGTITUDE };

    [response] = await db.query(`
        SELECT LONGTITUDE, LATITUDE
        FROM LOCATIONS
        WHERE USER = ?`, ["ADMIN"]);

    data.warehouse = { lat: response[0].LATITUDE, lng: response[0].LONGTITUDE };

    [response] = await db.query(`
        SELECT amount, product, CATEGORY, PRODUCT_NAME
        FROM VAN_LOAD JOIN PRODUCTS
            ON VAN_LOAD.product = PRODUCTS.ID
        WHERE VAN_LOAD.rescuer = ?`, [username]);

    data.load = [];
    for (let pro of response)
        data.load.push({ id: pro.product, name: pro.PRODUCT_NAME, category: pro.CATEGORY, amount: pro.amount });

    return data;
}

export async function unloadProducts(data) {
    let [response] = await db.query(`CALL UNLOAD_PRODUCTS(?,?,?)`, [data.id, data.amount, data.rescuer]);

    return response;
}

export async function getWarehouseProducts() {
    const response = await db.query("SELECT ID, PRODUCT_NAME, AMOUNT FROM WAREHOUSE JOIN PRODUCTS ON WAREHOUSE.PRODUCT = PRODUCTS.ID WHERE PRODUCTS.DISCONTINUED = 0 AND WAREHOUSE.AMOUNT != 0");

    return response;
}

export async function loadProducts(data) {
    for (let prod of data) {
        await db.query(`CALL LOAD_PRODUCTS(?,?,?)`, [prod.id, prod.amount, prod.rescuer]);
    }
    return { status: 200 };
}

export async function setActive(data) {
    const [response] = await db.query(`UPDATE USERS SET ACTIVE = ? WHERE USERS.USERNAME = ?`, [data.active, data.user]);

    return response;
}

export async function getProductsOnVan() {
    const [response] = await db.query(`
        SELECT USERNAME, NAME, PRODUCT_NAME, CATEGORY, amount 
        FROM VAN_LOAD JOIN USERS ON VAN_LOAD.rescuer = USERS.USERNAME 
            JOIN PRODUCTS ON PRODUCTS.ID = VAN_LOAD.product`);

    let data = [];
    for (let prod of response) {
        const index = data.findIndex(datum => datum.username == prod.USERNAME);

        if (index === -1)
            data.push({
                username: prod.USERNAME,
                name: prod.NAME,
                products: [
                    {
                        name: prod.PRODUCT_NAME,
                        category: prod.CATEGORY,
                        amount: prod.amount
                    }
                ]
            })
        else
            data[index].products.push({
                name: prod.PRODUCT_NAME,
                category: prod.CATEGORY,
                amount: prod.amount
            })

    }

    return data;
}