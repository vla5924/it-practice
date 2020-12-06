let database = require('./database.js');

const tables = {
    users     : "users",
    customers : "customers",
    managers  : "managers",
    tickets   : "tickets"
};

const roles = [ "customer", "manager", "admin" ];

let db = new database({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'support'
});
let isInitialized = false;

module.exports.checkDb = function () {
    if (!isInitialized)
        throw "Error";
};

module.exports.init = function () {
    db.exec(`CREATE TABLE IF NOT EXISTS ${tables.users} (
        id INTEGER AUTO_INCREMENT PRIMARY KEY NOT NULL,
        login VARCHAR(20) NOT NULL,
        password VARCHAR(20) NOT NULL,
        fio VARCHAR(100) DEFAULT '' NOT NULL,
        phone VARCHAR(20) DEFAULT '' NOT NULL,
        role INTEGER DEFAULT 0 NOT NULL,
        session VARCHAR(10) NOT NULL
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS ${tables.tickets} (
        id INTEGER AUTO_INCREMENT PRIMARY KEY NOT NULL,
        timestamp INTEGER,
        description TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        assigned_to INTEGER NOT NULL,
        is_closed INTEGER DEFAULT 0 NOT NULL,
        comment TEXT NOT NULL
    )`);
    isInitialized = true;
};

module.exports.setDemo = function (users) {
    this.checkDb();
    users.forEach(user => {
        db.exec(`INSERT INTO ${tables.users} SET 
                 login = '${user.login}', 
                 password = '${user.password}', 
                 fio = '${user.fio}', 
                 phone = '${user.phone}', 
                 role = ${user.role}`);
    });
};

module.exports.authUserWithSession = function (session) {
    this.checkDb();
    let userExists = db.fetchOne(`SELECT COUNT(*) FROM ${tables.users} WHERE session = '${session}'`);
    if (!userExists)
        return { ok: false };
    let user = db.fetchRow(`SELECT * FROM ${tables.users} WHERE session = '${session}'`);
    return { ok: true, ...user};
};

module.exports.authUserWithLogin = function (login, password) {
    this.checkDb();
    let userExists = db.fetchOne(`SELECT COUNT(*) FROM ${tables.users} WHERE login = '${login}' AND password = '${password}'`);
    if (!userExists)
        return { ok: false };
    let user = db.fetchRow(`SELECT * FROM ${tables.users} WHERE login = '${login}'`);
    user.session = user.id + user.login;
    db.exec(`UPDATE ${tables.users} SET session = '${user.session}' WHERE id = ${user.id}`);
    return { ok: true, ...user};
};

module.exports.getTickets = function () {
    this.checkDb();
    return db.fetchAll(`SELECT * FROM ${tables.tickets} ORDER BY timestamp DESC`);
};

module.exports.getUsers = function () {
    this.checkDb();
    let usersRaw = db.fetchAll(`SELECT * FROM ${tables.users} ORDER BY timestamp DESC`);
    let users = [];
    usersRaw.forEach(user => { users[user.id] = user });
    return users;
};

module.exports.addTicket = function (userId, description) {
    this.checkDb();
    let result = db.exec(`INSERT INTO ${tables.tickets} SET timestamp = ${Date.now()}, description = '${description}', created_by = ${userId}, assigned_to = 0`);
    return db.fetchRow(`SELECT * FROM ${tables.tickets} WHERE id = ${result.insertId}`);
}