if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ quiet: true });
}

const express = require('express');
const app = express();

app.set('query parser', 'extended');

const path = require('path');
const mon = require('mongoose');
const morgan = require('morgan')
const ejsMate = require('ejs-mate')
const override = require('method-override')
const joi = require('joi');
const campground = require('./models/campground');
const rev = require('./models/rev');
const { title } = require('process');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const Localpass = require('passport-local');
const User = require('./models/user');
const { storage } = require('./cloudinary/index');
const { MissingUsernameError } = require('passport-local-mongoose/dist/lib/errors');
const { isLoggedin, storeReturnTo, isAuthor, isRevAuthor, validateCampground, validateReview } = require('./middleware')
const multer = require('multer');
const helmet = require('helmet');
const upload = multer({ storage });
const { cloudinary } = require('./cloudinary');
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;
const sanitizeV5 = require('./utils/mongoSanitizeV5.js');
const catchAsync = require('./utils/catchAsync');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/YelpCamp-map';
const secret = process.env.SECRET || 'WellDone!';


const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});
store.on('error', function (e) {
    console.log('session store error', e)
});
let cached = global._mongooseConn;
if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}
async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mon.connect(dbUrl);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
connectDB()
    .then(() => console.log('Connected to DB'))
    .catch((err) => console.log('DB connection error:', err));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(override('_method'));
app.use(express.static(path.join(__dirname, 'stylesheet')));
app.use(express.static(path.join(__dirname, 'javascripts')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sanitizeV5({ replaceWith: '_' }));


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/",
];
const connectSrcUrls = [
    "https://api.maptiler.com/",
    "https://cdn.maptiler.com/",
    "https://cdn.jsdelivr.net/",
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/",
                "https://images.unsplash.com/",
                "https://api.maptiler.com/"
            ],
            fontSrc: ["'self'"],
        },
    })
);

const session1 = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(session1));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localpass(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('YouDidIt');
    res.locals.welcome = req.flash('hi');
    res.locals.e = req.flash('e');
    next();
})

app.get('/', (req, res) => {
    res.render('HOME');
})

app.get('/campG', catchAsync(async (req, res) => {
    const camp = await campground.find({});
    res.render('campG/index2', { camp });
}));

app.get('/campG/new', isLoggedin, (req, res) => {
    res.render('campG/new');

})

app.post('/campG', isLoggedin, upload.array('image'), validateCampground, catchAsync(async (req, res, next) => {
    console.log('files received:', req.files.length, req.files.map(f => f.originalname));
    const campSh = joi.object({
        campground: joi.object({
            title: joi.string().required(),
            price: joi.number().required(),
            location: joi.string().required(),
            desc: joi.string().required(),
        }).required(),
        deleteImages: joi.array()
    })
    const result = campSh.validate(req.body)

    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    console.log(geoData)
    if (!geoData.features?.length) {
        req.flash('e', 'Could not geocode that location. Please try again and enter a valid location.');
        return res.redirect('/campG/new');
    }

    const campD = new campground(req.body.campground)
    campD.geometry = geoData.features[0].geometry;
    campD.location = geoData.features[0].place_name;
    campD.image = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campD.author = req.user._id;
    console.log(campD);
    await campD.save();
    req.flash('YouDidIt', 'Successfully Created a New CampGround')
    res.redirect(`/campG/${campD._id}`)
}))

app.get('/campG/register', (req, res) => {
    res.render('users/register');
})

app.post('/campG/register', catchAsync(async (req, res, next) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registered = await User.register(user, password);

    req.login(registered, err => {
        if (err) return next(err);
        req.flash('YouDidIt', 'Welcome!');
        res.redirect('/campG');
    });
}));

app.get('/campG/login', (req, res) => {
    res.render('users/login');
})

app.post('/campG/login', storeReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/campG/login' }), (req, res) => {
    req.flash('YouDidIt', `Welcome Back Sir ${req.body.username}!`);
    const redirectUrl = res.locals.returnTo || '/campG';
    delete res.locals.returnTo;
    res.redirect(redirectUrl);
})

app.get('/campG/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
    })
    req.flash('YouDidIt', 'Successfully Logouted');
    res.redirect('/');
})

app.get('/campG/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const campD = await campground.findById(id).populate({
        path: 'review',
        populate: {
            path: 'author'
        }
    }).populate('author');
    res.render('campG/show', { campD, message: req.flash('YouDidIt') });
}))

app.get('/campG/:id/edit', isLoggedin, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campD = await campground.findById(id);
    if (!campD) {
        req.flash('e', 'You Cant Do That');
        return res.redirect('/campG');
    }
    res.render('campG/edit', { campD });
}))

app.post('/campG/:id/rev', isLoggedin, validateReview, catchAsync(async (req, res) => {
    console.log(req.body);
    const campD = await campground.findById(req.params.id);
    const review1 = new rev(req.body.rev);
    review1.author = req.user._id;
    campD.review.push(review1)
    await review1.save();
    await campD.save();
    req.flash('YouDidIt', 'Successfully Created a New Review')
    res.redirect(`/campG/${campD._id}`)
}))

app.put('/campG/:id', isLoggedin, isAuthor, upload.array('image'), validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;

    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    if (!geoData.features?.length) {
        req.flash('e', 'Could not geocode that location. Please try again and enter a valid location.');
        return res.redirect(`/campG/${id}/edit`);
    }

    const campD = await campground.findByIdAndUpdate(id, { ...req.body.campground })
    campD.geometry = geoData.features[0].geometry;
    campD.location = geoData.features[0].place_name;
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campD.image.push(...imgs);
    await campD.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campD.updateOne({ $pull: { image: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('YouDidIt', 'Successfully Edit a CampGround')
    res.redirect(`/campG/${campD._id}`)
}))

app.delete('/campG/:id', isLoggedin, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await campground.findByIdAndDelete(id)
    req.flash('YouDidIt', 'Successfully Deleted a CampGround')
    res.redirect('/campG');
}));

app.delete('/campG/:id/reviews/:reviewId', isLoggedin, isRevAuthor, catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await campground.findByIdAndUpdate(id, { $pull: { review: reviewId } });
    await rev.findByIdAndDelete(reviewId);
    req.flash('YouDidIt', 'Successfully Deleted Review');
    res.redirect(`/campG/${id}`);
}))

app.all('/{*path}', (req, res) => {
    res.status(404).send('Page Not Found');
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).send(err.message);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Running on port ${port}`);
})