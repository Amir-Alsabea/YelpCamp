const campground = require('./models/campground');
const rev = require('./models/rev');

module.exports.isLoggedin = function (req,res,next){
    if(!req.isAuthenticated()){
            req.session.returnTo = req.originalUrl; 
            req.flash('e', 'You Have to Be Signed in');
            return res.redirect('/campG/login');
        }
        next();
}
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}
module.exports.isAuthor = async(req,res,next)=>{
      const {id} = req.params;
        const campD2 = await campground.findById(id);
        if(!campD2.author.equals(req.user._id)){
            req.flash('e','Sorry, You Dont Have a Premission to Do That');
            return res.redirect(`/campG/${id}`);
        }
        next();
}
module.exports.isRevAuthor = async(req,res,next)=>{
      const {reviewId,id} = req.params;
        const review = await rev.findById(reviewId);
        if(!review.author.equals(req.user._id)){
            req.flash('e','Sorry, You Dont Have a Premission to Do That');
            return res.redirect(`/campG/${id}`);
        }
        next();
}
const { campgroundSchema, reviewSchema } = require('./schemas');
const ExpressError = require('./utils/ExpressError'); // Colt creates this custom error class too — see Step 3

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}