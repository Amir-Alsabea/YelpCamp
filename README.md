# YelpCamp

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?logo=mongoose&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-Templating-B4CA65?logo=ejs&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Hosting-3448C5?logo=cloudinary&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

![YelpCamp Screenshot](public/images/screenshot.png)

YelpCamp is a full-stack web application for discovering, sharing, and reviewing campgrounds. Built as a Yelp-style platform for the outdoors, it lets users browse a curated list of campgrounds, view them on an interactive cluster map, and share their own camping spots with photos, pricing, and location details.

## Features

-  **User Authentication** — secure registration and login with Passport.js
-  **Campground Management** — create, edit, and delete campground listings (author-only permissions)
-  **Image Uploads** — multi-image support via Cloudinary with in-browser deletion
-  **Interactive Maps** — geocoding and cluster maps powered by MapTiler
-  **Reviews & Ratings** — star-based review system with per-user delete permissions
-  **Custom Dark Theme** — Bootstrap 5 UI with a fully custom dark aesthetic
-  **Security** — Helmet CSP, input sanitization, and Joi-based server-side validation

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose  
**Frontend:** EJS, ejs-mate, Bootstrap 5  
**Auth:** Passport.js (Local Strategy), express-session, connect-mongo  
**Storage:** Cloudinary (image hosting), Multer (uploads)  
**Maps/Geocoding:** MapTiler Client SDK  
**Deployment:** Vercel

## Getting Started

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with your `DB_URL`, `SECRET`, `MAPTILER_API_KEY`, and Cloudinary credentials
4. Run `node app.js` (or `nodemon app.js` for development)
5. Visit `http://localhost:3000`
