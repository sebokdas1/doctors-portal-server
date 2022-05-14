const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a0ke4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctorsPortal').collection('services');
        const bookingCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/available', async (req, res) => {
            const date = req.query.date;
            //get all services
            const services = await serviceCollection.find().toArray();
            //get all booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();
            //for each service
            services.forEach(service => {
                //find booking for that service
                const serviceBookings = bookings.filter(book => book.treatement === service.name);
                //select slots for the service booking
                const bookedSlots = serviceBookings.map(book => book.slot);
                //select those slots that are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = available;
            });
            res.send(services);
        });

        // Warning: This is not the proper way to query multiple collection. 
        // After learning more about mongodb. use aggregate, lookup, pipeline, match, group


        app.post('/booking', async (req, res) => {
            const booking = req.body;
            //for find patient same service booking at same date
            const query = { treatement: booking.treatement, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({ success: true, result });
        });


    }
    finally { }

}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors World!')
})

app.listen(port, () => {
    console.log(`Doctor app listening on port ${port}`)
})