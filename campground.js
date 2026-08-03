const mon = require('mongoose');
const revi = require('./rev');
const { string } = require('joi');
const monsh = mon.Schema;


const imageSchema = new monsh({
    url: String,
    filename: String
})
imageSchema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload', '/upload/w_200,h_130/')
})

const opts = { toJSON: { virtuals: true } };

const CampSchema = new monsh({
    title: String,
    image: [imageSchema],
    price: Number,
    desc: String,
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    author:{
        type:monsh.Types.ObjectId,
        ref: 'User'
    },
    review: [
        {
            type: monsh.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts); // ← ← ← CHANGE THIS LINE!

CampSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campG/${this._id}">${this.title}</a></strong>
    <p>${this.desc.substring(0, 20)}...</p>`
});

CampSchema.post('findOneAndDelete', async (doc)=>{
    if(doc){
        await revi.deleteMany({
            _id: {
                $in: doc.review
            }
        })
    }
})

module.exports = mon.model('cgs', CampSchema);