const express= require('express');
const { release } = require('os');
const {Pool}=require('pg');
const port=8000;
const app = express();
console.log(`hello`);

const pool=new Pool({
    user:'postgres',
    host:'localhost',
    database:'demo',
    password:'',
    dialect:'postgres',
    port:5432
});

app.use(express.json());


    
    
app.get('/',(req,res)=>{
        pool.connect((err,client,release)=>{
            if(err) throw err;
            client.query('select now()',(err,result)=>{
            release();
            if(err){
                throw err;
            }
            console.log(`connected`);
            });
        });

        pool.query('select * from fruit').then(testData=>{
            console.log(testData);
            res.send(testData.rows);
        });
});



app.post('/analyze',async (req,res)=>{
    const {query}=req.body;
    try{
        const result=await pool.query(`explain (analyze,format json) ${query}`);

        res.json(result.rows[0]["QUERY PLAN"][0]);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

app.listen(port,()=>{
    console.log(`listening on port:${port}`);
});