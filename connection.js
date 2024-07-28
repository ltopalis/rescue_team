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

const loc = await getWarehouseLocation();
console.log(loc);

