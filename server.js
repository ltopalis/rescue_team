import express from "express";
import path from "path";
import session from 'express-session';
import bodyParser from 'body-parser';
import {
    getUser, getWarehouseLocation, signup,
    getProducts, alterAvailabilityProduct, getProductCategories,
    addCategory, addProduct, updateProductAmount
} from './connection.js'

const PORT = 3000;
const app = express();
const __dirname = "/app/website";
const cookie_name = "user-data";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
    name: cookie_name,
    secret: 'secret-key',
    cookie: { maxAge: 1000 * 60 * 30 }, // 30 minutes
    saveUninitialized: false,
}));

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {

    // logged in
    if (req.session.userData != undefined) {
        if (req.session.userData.role == 'ADMIN')
            res.status(200).sendFile(path.join(__dirname, "html", "adminPage", "addRescuer.html"));
        else if (req.session.userData.role == 'CITIZEN')
            res.status(200).sendFile(path.join(__dirname, "html", "citizenPage", "citizen.html"));
        else if (req.session.userData.role == 'RESCUER')
            res.status(200).sendFile(path.join(__dirname, "html", "rescuerPage", "map.html"));
    }
    else // not logged in
        res.status(200).sendFile(path.join(__dirname, "login.html"));
});

app.post("/validatePage/", (req, res) => {
    const requestedPage = req.body.page;
    const requestedUser = req.session.userData ? req.session.userData.role : null;

    if (requestedPage == requestedUser)
        res.status(200).send({ info: "Access granded" });
    else
        res.status(500).send({ info: "Access denied" });
});

app.get("/logout", async (req, res) => {
    req.session.destroy();

    res.sendStatus(200);
});

app.post("/login", async (req, res) => {
    const user = await getUser(req.body.login_username, req.body.login_password);

    if (user.length) {
        req.session.userData = {
            name: user[0].NAME,
            username: user[0].USERNAME,
            role: user[0].ROLE,
            lng: user[0].LONGTITUDE,
            lat: user[0].LATITUDE
        };

        if (user[0].ROLE == 'ADMIN')
            res.send({ path: path.join("html", "adminPage", "addRescuer.html"), info: 'SUCCESS' });
        else if (user[0].ROLE == 'CITIZEN')
            res.send({ path: path.join("html", "citizenPage", "index.html"), info: 'SUCCESS' });
        else if (user[0].ROLE == 'RESCUER')
            res.send({ path: path.join("html", "rescuerPage", "map.html"), info: 'SUCCESS' });
    }
    else res.send({ info: 'FAIL' });
});

app.get("/getWarehouseLocation", async (req, res) => {
    const loc = await getWarehouseLocation();

    res.status(200).send(JSON.stringify(loc));
});

app.get("/calculateCitizenPosition", async (req, res) => {
    // Latitude (North-South):
    // Latitude represents how far north or south a point is from the equator.
    // The Earth's circumference is approximately 40,075 km.
    // Therefore, 1 degree of latitude is approximately 40,075 km / 360 = 111.32km.

    // Longitude (East-West):

    // Longitude represents how far east or west a point is from the prime meridian.
    // The length of a degree of longitude varies with latitude. To account for this, we use cos(latitude) as a correction factor.
    // The formula for converting kilometers to degrees of longitude at a given latitude is radius / (111.32 * cos(latitude))

    // Math.random() generates a random number between 0 and 1.
    // (Math.random() - 0.5) gives a random number between -0.5 and 0.5, providing a random direction.
    // (radius / 111.32) converts the desired radius from kilometers to degrees for latitude.
    // (radius / (111.32 * Math.cos((Math.PI / 180) * center.lat))) converts the desired radius from kilometers to degrees for longitude, considering the latitude of the center point.

    const loc = await getWarehouseLocation();

    const radius = 50; // in kilometers

    let latitude = loc.LATITUDE + (Math.random() - 0.5) * 2 * (radius / 111.32);
    let longtitude = loc.LONGTITUDE + (Math.random() - 0.5) * 2 * (radius / (111.32 * Math.cos((Math.PI / 180) * loc.LATITUDE)));

    res.send(JSON.stringify({ latitude, longtitude }));

});

app.post("/signup", async (req, res) => {
    const name = req.body.signup_name;
    const username = req.body.signup_username;
    const password = req.body.signup_password;
    const role = req.body.signup_role;
    const lng = req.body.longtitude;
    const lat = req.body.latitude;

    const result = await signup(username, password, name, role, lat, lng);

    res.send(result);

});

app.get("/logout", (req, res) => {

    req.session.destroy(error => {
        if (error)
            return req.status(500).send("ERROR LOGOUT");

        res.clearCookie(cookie_name);
        res.sendStatus(200)

    });
});

/////////////////////////////////////////////////
///////////////////// ADMIN /////////////////////
/////////////////////////////////////////////////

app.get("/admin/getProducts", async (req, res) => {
    const products = await getProducts();

    res.send(JSON.stringify(products));
});

app.post("/admin/alterAvailabilityProduct", async (req, res) => {
    const id = req.body.id;
    const discontinued = req.body.discontinued;

    const result = await alterAvailabilityProduct(id, discontinued);

    res.status(200).send(result);
});

app.get("/admin/getCategories", async (req, res) => {
    const categories = await getProductCategories();

    res.status(200).send(categories);
});

app.post("/admin/addCategory", async (req, res) => {

    const result = await addCategory(req.body.category);

    res.send(result);
});

app.post("/admin/addProduct", async (req, res) => {

    const result = await addProduct(req.body);
    
    res.send(result);
});

app.post("/admin/updateAmount", async (req, res) => {
    for (let prod of req.body)
        await updateProductAmount(prod.id, prod.amount);

    res.sendStatus(200);
})

app.listen(PORT, () => {
    console.log(`Server is sunning on Port ${PORT}`);
});