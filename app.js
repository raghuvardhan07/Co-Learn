import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import MongoDBStore from 'connect-mongodb-session'
import {connectToMongoDB, getUsers, getUserName, checkUser, createUser, getUsersExcept, getSameLang} from "./database.js"

const MongoDBStoreSession = MongoDBStore(session)

let connected = await connectToMongoDB()
console.log(connected);

const store = new MongoDBStoreSession({
    uri: process.env.MONGODB_URI, 
    collection: 'sessions'
})

const secretToken = String(Math.floor(Math.random() * 100000))

const app = express();

app.use(session({
    secret: secretToken, 
    resave: false, 
    saveUninitialized: true, 
    store: store,
    name: 'user-session'
}))

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/login", async function(req, res){
    if (req.session.user === undefined){
        res.render("login")
    }
    else{
        res.redirect("/dashboard")
    }
})

app.post("/login", async function(req, res){
    let username = req.body.username;
    let password = req.body.password;
    if (username === null){
        res.send("<h1>No username</h1>")
    }
    const u = await getUserName(username);
    console.log(u);
    if (u.username === username && u.password === password){
        if (req.session.user === undefined){
            req.session.user = {
                uuid: String(Math.floor(Math.random() * 100000)), 
                username: u.username,
                rating: u.rating,
                gender: u.gender, 
                native: u.native, 
                learning: u.learning
    
            };
            req.session.save((err) => {
                if (err) {
                    res.send("Error!");
                } else {
                    req.session.user = req.session.user; 
                    res.redirect("/dashboard")
                }
            });
        } 
        else{
            res.redirect("/dashboard")
        }
        
    }
    else{
        res.send("<h1>Incorrect credentials</h1>")
    }
    
})

app.get("/dashboard", async function(req, res){
    let user = req.session.user
    if (user !== undefined){
        
        const users = await getSameLang(user.username, user.learning);
        // console.log(users);
        
        users.sort((a, b) => Math.abs(a.rating - user.rating) - Math.abs(b.rating - user.rating));
        res.render("dashboard", {username : user.username, users: users})
    }
    else{
        res.send("<h2>Unauthorized!!</h2>")
    }
})

app.get("/profile", async (req, res) => {
    const user = await getUserName(req.session.user.username);
    res.render('profile', {user: user})
})

app.get("/signUp", function(req, res){
    res.render("signup");
})


app.post("/signUp", async function(req, res){
    let name = req.body.name;
    let gender = req.body.gender;
    let native = req.body.native;
    let learning = req.body.learning;
    let email = req.body.email;
    let mobile = req.body.number;
    let username = req.body.username;
    let password = req.body.password;
    let rating = req.body.rating;
    if (username === null){
        res.send("<h1>No username</h1>")
    }
    const u = await getUserName(username);
    console.log(u);
    if (u === null){
        const user = await createUser(name, gender, native, learning, email, mobile, rating, username, password)
        console.log(user);
        req.session.user = {
            uuid: String(Math.floor(Math.random() * 100000)), 
            username: username,
            rating: rating,
            gender: gender, 
            native: native, 
            learning: learning

        };
        req.session.save((err) => {
            if (err) {
                res.send("Error!");
            } else {
                req.session.user = req.session.user; 
                res.redirect("/login")
            }
        });
    }
    else{
        res.send("<h1>Username already exists</h1>")
    }
    
    
})

app.get("/admin", function(req, res){
    res.render("admin");
})

app.post("/call", async (req, res) => {
    console.log(req.body.uname)
    const uid = await getUserName(req.body.uname)
    console.log(uid);
    const theyid = await getUserName(req.body.theyname)
    let theyid_id = null
    if (theyid !== null){
        theyid_id = theyid._id
    }
    
    const uids = {uid: uid._id, theyid: theyid_id}

    console.log(uids);
    res.render("call", {username: req.body.theyname, uids : uids})
})

app.get("/logout", (req, res) =>{
    req.session.destroy(err => {
        if(err){
            console.log(err);
        } else {
            res.redirect("/login")
        }
    }); 
})

app.listen(process.env.PORT, function(){
    console.log("Server running at port ...");
})