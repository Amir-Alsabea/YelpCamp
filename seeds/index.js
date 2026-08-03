const mon = require('mongoose');
const campground = require('../models/campground');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');

mon.connect('mongodb://localhost:27017/YelpCamp-map').then(() => {
    console.log('Connected to DB');
}).catch((err) => {
    console.log('Error:', err);
});

const DP = arr => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    await campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const ran1000 = Math.floor(Math.random() * 1000);
        let price = Math.floor(Math.random() * 20) + 10;
        const camp = new campground({
            author: '6a639926230c3d407dc9d43e',
            location: `${cities[ran1000].city}, ${cities[ran1000].state}`,
                        geometry: {
                type: "Point",
                coordinates: [
                    cities[ran1000].longitude,
                    cities[ran1000].latitude,
                ]
            },
            title: `${DP(descriptors)} ${DP(places)}`,
            // image: `https://picsum.photos/400?random=${Math.random()}`,
            desc: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. At vel amet itaque eligendi ad vitae eum nisi, facilis aliquam et, quod officia sunt officiis? Minima, maiores. Voluptatibus porro asperiores ipsum!',
            price,
            image: [
      {
        url: 'https://res.cloudinary.com/gsh6bxwz/image/upload/v1784820333/YelpCamp/sod6ynepzepzpikacgnc.png',
        filename: 'YelpCamp/sod6ynepzepzpikacgnc',
      },
      {
        url: 'https://res.cloudinary.com/gsh6bxwz/image/upload/v1784820336/YelpCamp/jqwauoldto272usfputp.png',
        filename: 'YelpCamp/jqwauoldto272usfputp',
      }
    ]
        })
        console.log(camp)
        await camp.save();
    }
}


seedDB().then(() => {
    mon.connection.close();
})