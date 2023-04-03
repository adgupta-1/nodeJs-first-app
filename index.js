const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
mongoose.connect('mongodb://127.0.0.1:27017', {dbName: "users"}).then(() => console.log('DB is connected')).catch((e) => console.log(e))
const app = express()


// middleware to make public as a static / byDefault folder
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// ejs setup
app.set("view engine", "ejs")

const UserSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const user = mongoose.model('userProfiles', UserSchema)

// app.get('/', async (req, resp) => {
//     resp.send(await user.find({}))
// })

// app.get('/add', async (req, resp)=> {
//     user.create({
//         name: "Rahul", 
//         email: "rahul123@gmail.com"
//     })
//     resp.send(await user.find({}))
// })
// app.get('/contact', (req, resp) => {
//     // resp.render("success", {list: list})
// //     resp.json({
// //         list
// //     })
// // })


// // app.post('/', (req, resp) => {
// //     // list.push(req.body)
// //     list.push({name: req.body.name, email: req.body.eMail})
// //     resp.redirect("/contact")
// // })


const isAuthentocated = async(req, resp, next) => {
    
    const {token} = req.cookies
    if(token){
        const decoded = jwt.verify(token, "fhgfbuadjbnc")
        req.User =await user.findById(decoded._id)
        next()
    }else{
        resp.redirect('/login')
    }
}


app.get('/', isAuthentocated, (req, resp) => {
    resp.render('logout', {name: req.User.name})
})

app.get('/login', (req, resp) => {
    resp.render('login')
})

app.post('/login', async (req, resp) => {
    const {eMail, password} = req.body;
    let User = await user.findOne({email: eMail})
    console.log(User)
    if(!User) return resp.redirect('/register')
    
    // const isMatch = User.password === password;
    const isMatch = await bcrypt.compare(password, User.password)
    if(!isMatch) return resp.render('login', {message: "Incorrect Password"})

    let token = jwt.sign({_id: User._id}, "fhgfbuadjbnc")

    resp.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 30*1000)
    })
    resp.redirect('/')

})

app.get('/register', (req, resp)=> {
    resp.render('register')
})
// login authentication api
app.post('/register', async(req, resp) => {
    const {name, eMail, password} =(req.body);

    let User = await user.findOne({email: eMail})
    // console.log(User)
    if(User){
        return resp.redirect('/login')
    }

    const hassedPwd = await bcrypt.hash(password, 10);
    let result = await user.create({name, email: eMail, password:hassedPwd})
    

    let token = jwt.sign({_id: result._id}, "fhgfbuadjbnc")

    resp.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 30*1000)
    })
    resp.redirect('/')
})



app.get('/logout', (req, resp)=> {

    resp.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    resp.redirect('/')
})
app.listen(8000, () => {
    console.log("Server is running on port 8000")
})