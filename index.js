const express= require('express');
const cors=require('cors');
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

app.use(cors());

app.use(express.json());


function parsePlan(node){
    return {
        type:node["Node Type"],
        cost:node["Total Cost"],
        rows:node["Actual Rows"],
        loops:node["Actual loops"],
        children:node.Plans?node.Plans.map(parsePlan):[]
    }
}
    
    
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

        // res.json(result.rows[0]["QUERY PLAN"][0]);
        const rawPlan=result.rows[0]["QUERY PLAN"][0];
        const parsed = parsePlan(rawPlan.Plan);
        res.json(parsed);
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

app.listen(port,()=>{
    console.log(`listening on port:${port}`);
});