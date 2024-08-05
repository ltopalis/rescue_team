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

    [response] = await db.query(`
        SELECT  uor1.id          AS taskId, 
                u1.USERNAME      AS citizenUsername, 
                u1.NAME          AS citizenName, 
                uor1.type        AS type, 
                uor1.status      AS status, 
                uor1.createdOn   AS creationDate, 
                por1.product     AS productId, 
                pr1.PRODUCT_NAME AS productName, 
                por1.amount      AS productAmount, 
                u2.USERNAME      AS rescuerUsername, 
                u2.Name          AS rescuerName, 
                uor1.assumedOn   AS assumedDate,
                loc.LATITUDE     AS lat,
                loc.LONGTITUDE   AS lng 
        FROM ProductsOffersRequests AS por1 
            JOIN UserOffersRequests AS uor1 ON por1.offerId = uor1.id 
            JOIN USERS AS u1 ON u1.USERNAME = uor1.user 
            JOIN PRODUCTS as pr1 ON pr1.ID = por1.product 
            JOIN LOCATIONS as loc ON loc.USER = uor1.user
            LEFT JOIN USERS as u2 ON u2.USERNAME = uor1.assumedBy 
        WHERE status != 'completed' 
            AND (uor1.assumedBy = ? OR uor1.assumedBy IS NULL)`, [username]);

    data.currentTasks = [];
    data.tasks = [];
    for (let task of response) {

        if (task.rescuerUsername) {
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
        else {
            const index = data.tasks.findIndex(t => t["id"] == task.taskId);

            if (index === -1) {
                const createdon = new Date(task.creationDate);
                data.tasks.push({ id: task.taskId, username: task.citizenUsername, location: { lat: task.lat, lng: task.lng }, name: task.citizenName, date: `${createdon.getUTCFullYear()}-${(createdon.getUTCMonth() + 1).toString().padStart(2, '0')}-${createdon.getUTCDate().toString().padStart(2, '0')}`, type: (task.type == "offer" ? "Προσφορά" : "Αίτηση"), products: [{ id: task.productId, name: task.productName, amount: task.productAmount }] })
            }
            else {
                data.tasks[index].products.push({ id: task.productId, name: task.productName, amount: task.productAmount });
            }
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
        SELECT  USERS.USERNAME, 
                USERS.NAME, 
                USERS.ACTIVE, 
                LOCATIONS.LONGTITUDE, 
                LOCATIONS.LATITUDE, 
                VAN_LOAD.amount AS load_amount, 
                PRODUCTS.PRODUCT_NAME AS load_name, 
                UserOffersRequests.id AS taskId,
                PRODUCTS.ID AS prodId
        FROM USERS 
            LEFT JOIN LOCATIONS ON USERS.USERNAME = LOCATIONS.USER
            JOIN VAN_LOAD ON VAN_LOAD.rescuer = USERS.USERNAME
            JOIN PRODUCTS ON PRODUCTS.ID = VAN_LOAD.product
            JOIN UserOffersRequests ON UserOffersRequests.assumedBy = USERS.USERNAME
        WHERE USERS.ROLE = 'RESCUER' AND PRODUCTS.DISCONTINUED = 0 AND UserOffersRequests.status != 'completed'`);

    for (let row of response) {
        const index = data.rescuers.findIndex(rescuer => rescuer.username == row.USERNAME);

        if (index === -1)
            data.rescuers.push({
                username: row['USERNAME'],
                name: row['NAME'],
                active: row.ACTIVE ? true : false,
                location: { lat: row.LATITUDE, lng: row.LONGTITUDE },
                products: [{ id: row.prodId, name: row.load_name, amount: row.load_amount }],
                tasks: [row.taskId],
                _lines: []
            });
        else {
            if (data.rescuers[index].products.findIndex(prod => prod.id == row.prodId) === -1)
                data.rescuers[index].products.push({ id: row.prodId, name: row.load_name, amount: row.load_amount });

            if (!data.rescuers[index].tasks.includes(row.taskId))
                data.rescuers[index].tasks.push(row.taskId);
        }
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
        WHERE UserOffersRequests.status != 'completed'`);

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