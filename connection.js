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

export async function updateWarehousePostition(params) {
    const [response] = await db.query(`
        UPDATE LOCATIONS
        SET LATITUDE = ?, LONGTITUDE = ?
        WHERE USER = 'ADMIN'`, [params.lat, params.lng]);

    return response;
}

export async function initAdminMap() {
    let [response] = await db.query(`
        SELECT LATITUDE, LONGTITUDE
        FROM LOCATIONS
        WHERE USER = 'ADMIN'`);

    const data = {
        warehouse: { lat: response[0].LATITUDE, lng: response[0].LONGTITUDE },
        rescuers: [],
        tasks: []
    };

    [response] = await db.query(`
        SELECT  USERS.USERNAME AS USERNAME,
                USERS.NAME AS NAME,
                USERS.ACTIVE AS ACTIVE,
                LOCATIONS.LONGTITUDE AS LONGTITUDE,
                LOCATIONS.LATITUDE AS LATITUDE,
                VAN_LOAD.amount AS prodAmount,
                PRODUCTS.PRODUCT_NAME AS prodName,
                PRODUCTS.ID AS prodId
        FROM USERS 
	        JOIN LOCATIONS ON USERS.USERNAME = LOCATIONS.USER
            LEFT JOIN VAN_LOAD ON VAN_LOAD.rescuer = USERS.USERNAME
            LEFT JOIN PRODUCTS ON PRODUCTS.ID = VAN_LOAD.product
        WHERE USERS.ROLE = 'RESCUER'`);

    for (let row of response) {
        const index = data.rescuers.findIndex(rescuer => rescuer.username == row.USERNAME);

        if (index === -1)
            data.rescuers.push({
                username: row['USERNAME'],
                name: row['NAME'],
                active: row.ACTIVE ? true : false,
                location: { lat: row.LATITUDE, lng: row.LONGTITUDE },
                products: row.prodId ? [{ id: row.prodId, name: row.prodName, amount: row.prodAmount }] : [],
                tasks: [],
                _lines: []
            });
        else {
            if (data.rescuers[index].products.findIndex(prod => prod.id == row.prodId) === -1)
                data.rescuers[index].products.push({ id: row.prodId, name: row.prodName, amount: row.prodAmount });

            if (!data.rescuers[index].tasks.includes(row.taskId))
                data.rescuers[index].tasks.push(row.taskId);
        }
    }

    [response] = await db.query(`
        SELECT id, assumedBy
        FROM UserOffersRequests
        WHERE UserOffersRequests.status = 'inTransition'`);

    for (let row of response) {
        const index = data.rescuers.findIndex(rescuer => rescuer.username == row.assumedBy);

        data.rescuers[index].tasks.push(row.id);
    }

    [response] = await db.query(`
        SELECT  ProductsOffersRequests.offerId AS taskId, 
                USERS.USERNAME, 
                USERS.NAME, 
                UserOffersRequests.type, 
                LOCATIONS.LONGTITUDE, 
                LOCATIONS.LATITUDE, 
                PRODUCTS.ID AS prodId, 
                PRODUCTS.PRODUCT_NAME AS prodName, 
                ProductsOffersRequests.amount AS prodAmount
        FROM UserOffersRequests 
            JOIN ProductsOffersRequests ON UserOffersRequests.id = ProductsOffersRequests.offerId
            JOIN USERS ON USERS.USERNAME = UserOffersRequests.user
            JOIN LOCATIONS ON USERS.USERNAME = LOCATIONS.USER
            JOIN PRODUCTS ON PRODUCTS.ID = ProductsOffersRequests.product
        WHERE UserOffersRequests.status NOT IN ('completed', 'canceled')`);

    for (let task of response) {
        const index = data.tasks.findIndex(t => t.id == task.taskId);

        if (index === -1)
            data.tasks.push({
                name: task.NAME,
                username: task.USERNAME,
                id: task.taskId,
                type: task.type,
                location: { lat: task.LATITUDE, lng: task.LONGTITUDE },
                products: [{ id: task.prodId, name: task.prodName, amount: task.prodAmount }]
            });
        else
            data.tasks[index].products.push({ id: task.prodId, name: task.prodName, amount: task.prodAmount });
    }


    return data;
}

export async function getAmountOfTasks(params) {

    let query = `SELECT SUM(CASE WHEN type = 'request' AND status = 'completed' THEN 1 ELSE 0 END) AS completed_requests, SUM(CASE WHEN type = 'offer' AND status = 'completed' THEN 1 ELSE 0 END) AS completed_offers, SUM(CASE WHEN type = 'request' AND (status != 'completed' OR status != 'canceled') THEN 1 ELSE 0 END) AS not_completed_requests, SUM(CASE WHEN type = 'offer' AND (status != 'completed' OR status != 'canceled') THEN 1 ELSE 0 END) AS not_completed_offers FROM UserOffersRequests `;

    let response;
    if (params.start === null && params.end === null)
        [response] = await db.query(query);
    else if (params.start !== null && params.end === null) {
        query += "WHERE createdOn > ?";
        [response] = await db.query(query, [params.start]);
    }
    else if (params.start === null && params.end !== null) {
        query += "WHERE createdOn < ?";
        [response] = await db.query(query, [params.end]);
    }
    else {
        query += "WHERE createdOn BETWEEN ? AND ?";
        [response] = await db.query(query, [params.start, params.end]);
    }

    return response[0];
}

export async function getAllProducts() {
    const [response] = await db.query(`SELECT ID, PRODUCT_NAME FROM PRODUCTS WHERE DISCONTINUED = 0`);

    return response;
}

export async function createAnnouncement(params) {
    let response = { insertId: null };
    for (let p of params)
        if (response.insertId)
            [response] = await db.query(`INSERT INTO ANNOUNCEMENT(id, product) VALUES(?, ?)`, [response.insertId, p]);
        else
            [response] = await db.query(`INSERT INTO ANNOUNCEMENT(product) VALUES(?)`, [p]);

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

    data.tasks = [];
    [response] = await db.query(`
        SELECT  UserOffersRequests.id AS taskId,
                citizen.USERNAME AS citizenUsername,
                citizen.NAME AS citizenName,
                UserOffersRequests.type AS type,
                UserOffersRequests.status AS status,
                UserOffersRequests.createdOn AS creationDate,
                PRODUCTS.ID AS productId,
                PRODUCTS.PRODUCT_NAME AS productName,
                ProductsOffersRequests.amount AS productAmount,
                LOCATIONS.LONGTITUDE AS lng,
                LOCATIONS.LATITUDE AS lat
        FROM UserOffersRequests JOIN USERS AS citizen ON citizen.USERNAME = UserOffersRequests.user
            JOIN LOCATIONS ON LOCATIONS.USER = citizen.USERNAME
            JOIN ProductsOffersRequests ON ProductsOffersRequests.offerId = UserOffersRequests.id
            JOIN PRODUCTS ON PRODUCTS.ID = ProductsOffersRequests.product
        WHERE UserOffersRequests.status = 'created';
    `);

    for (let task of response) {
        const index = data.tasks.findIndex(t => t["id"] == task.taskId);

        if (index === -1) {
            const createdon = new Date(task.creationDate);
            data.tasks.push({ id: task.taskId, username: task.citizenUsername, location: { lat: task.lat, lng: task.lng }, name: task.citizenName, date: `${createdon.getUTCFullYear()}-${(createdon.getUTCMonth() + 1).toString().padStart(2, '0')}-${createdon.getUTCDate().toString().padStart(2, '0')}`, type: (task.type == "offer" ? "Προσφορά" : "Αίτηση"), products: [{ id: task.productId, name: task.productName, amount: task.productAmount }] })
        }
        else {
            data.tasks[index].products.push({ id: task.productId, name: task.productName, amount: task.productAmount });
        }
    }

    [response] = await db.query(`
        SELECT  UserOffersRequests.id               AS taskId,
                    citizen.USERNAME                AS citizenUsername,
                    citizen.NAME                    AS citizenName,
                    UserOffersRequests.type         AS type,
                    UserOffersRequests.status       AS status,
                    UserOffersRequests.createdOn    AS creationDate,
                    PRODUCTS.ID                     AS productId,
                    PRODUCTS.PRODUCT_NAME           AS productName,
                    ProductsOffersRequests.amount   AS productAmount,
                    UserOffersRequests.assumedOn    AS assumedDate,
                    LOCATIONS.LONGTITUDE            AS lng,
                    LOCATIONS.LATITUDE              AS lat
        FROM UserOffersRequests JOIN USERS AS citizen ON citizen.USERNAME = UserOffersRequests.user
            JOIN LOCATIONS ON LOCATIONS.USER = citizen.USERNAME
            JOIN ProductsOffersRequests ON ProductsOffersRequests.offerId = UserOffersRequests.id
            JOIN PRODUCTS ON PRODUCTS.ID = ProductsOffersRequests.product
        WHERE UserOffersRequests.status = 'InTransition'
        	AND UserOffersRequests.assumedBy = ?`, [username]);

    data.currentTasks = [];
    for (let task of response) {
        const index = data.currentTasks.findIndex(t => t["id"] == task.taskId);

        if (index === -1) {
            const createdon = new Date(task.creationDate);
            const acceptedOn = new Date(task.assumedDate);
            data.currentTasks.push({ id: task.taskId, username: task.citizenUsername, location: { lat: task.lat, lng: task.lng }, acceptDate: `${acceptedOn.getUTCFullYear()}-${(acceptedOn.getUTCMonth() + 1).toString().padStart(2, '0')}-${acceptedOn.getUTCDate().toString().padStart(2, '0')}`, name: task.citizenName, date: `${createdon.getUTCFullYear()}-${(createdon.getUTCMonth() + 1).toString().padStart(2, '0')}-${createdon.getUTCDate().toString().padStart(2, '0')}`, type: (task.type == "offer" ? "Προσφορά" : "Αίτηση"), products: [{ id: task.productId, name: task.productName, amount: task.productAmount }] })
        }
        else {
            data.currentTasks[index].products.push({ id: task.productId, name: task.productName, amount: task.productAmount });
        }
    }

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

export async function getTask(body) {
    const [response] = await db.query(`
                                UPDATE UserOffersRequests
                                SET assumedBy = ?, status = 'inTransition', assumedOn = CURRENT_TIMESTAMP()
                                WHERE id = ?`, [body.username, body.taskId]);

    return response;
}

export async function cancelTask(body) {
    const [response] = await db.query(`
        UPDATE UserOffersRequests
        SET assumedBy = NULL, status = 'created', assumedOn = NULL
        WHERE id = ?`, [body.taskId]);

    return response;
}

export async function completeTask(params) {
    const [response] = await db.query(`CALL completeTask(?, ?)`, [params.username, params.taskId]);

    return response;
}

/////////////////////////////////////////////////
//////////////////// CITIZEN ////////////////////
/////////////////////////////////////////////////

export async function getAnnouncements() {
    const [response] = await db.query(`
        SELECT  ANNOUNCEMENT.id AS announcementID,
                ANNOUNCEMENT.date,
                PRODUCTS.PRODUCT_NAME AS productName,
                PRODUCTS.CATEGORY AS productCategory,
                DETAILS_OF_PRODUCTS.DETAIL_NAME AS detailName,
                DETAILS_OF_PRODUCTS.DETAIL_VALUE AS detailValue,
                PRODUCTS.ID AS prodID
        FROM ANNOUNCEMENT
            JOIN PRODUCTS ON PRODUCTS.ID = ANNOUNCEMENT.product
            JOIN DETAILS_OF_PRODUCTS ON DETAILS_OF_PRODUCTS.PRODUCT = PRODUCTS.ID
        ORDER BY ANNOUNCEMENT.date DESC`);

    return response;
}

export async function getOffersRequests(username) {
    const [response] = await db.query(`
        SELECT *
        FROM UserOffersRequests
	        JOIN ProductsOffersRequests ON UserOffersRequests.id = ProductsOffersRequests.offerId
            JOIN PRODUCTS ON PRODUCTS.ID = ProductsOffersRequests.product
        WHERE user = ?
        ORDER BY createdOn DESC;`, username);

    return response;
}

export async function cancelTaskFromCitizen(params) {

    const [response] = await db.query("UPDATE UserOffersRequests SET status = 'canceled' WHERE id = ?", [params]);

    return response;

}

export async function createTask(params) {
    const [response] = await db.query(`INSERT INTO UserOffersRequests(user, type) VALUES(?, ?)`, [params.user, params.type]);

    for (let prod of params.products)
        await db.query(`
            INSERT INTO ProductsOffersRequests
            VALUES (?,?,?)`, [response.insertId, prod.product, prod.amount]);

    return { status: 200 };
}

export async function getProductsCategories() {

    const [response] = await db.query('SELECT ID, CATEGORY, PRODUCT_NAME, DETAIL_NAME, DETAIL_VALUE FROM PRODUCTS JOIN DETAILS_OF_PRODUCTS ON PRODUCT = ID');

    return response;

}