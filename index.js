const express = require('express');
const Tasks = require('./tasks');

const app = express();
const port = 3000;

app.use(express.json());


app.use('/api', Tasks);


app.listen(port, ()=>{
    console.log("Servidor encendido");
})
