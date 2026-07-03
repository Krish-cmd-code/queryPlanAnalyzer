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
        actualRows:node["Actual Rows"],
        loops:node["Actual Loops"],
        relationName:node["Relation Name"],
        Filter:node["Filter"],

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

        await pool.query(
            `INSERT INTO query_history(query_text, plan_json)
            VALUES($1, $2)`,
            [query, rawPlan]
        );
        res.json(parsed);

        
        
    }catch(err){
        res.status(500).json({error: err.message});
    }
});



app.get("/history", async (req, res) => {
  const result = await pool.query(`
    SELECT id,
           query_text,
           created_at
    FROM query_history
    ORDER BY created_at DESC
    LIMIT 10
  `);

  res.json(result.rows);
});


app.get("/history/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT * FROM query_history WHERE id = $1`,
    [id]
  );

  res.json(result.rows[0]);
});

app.listen(port,()=>{
    console.log(`listening on port:${port}`);
});