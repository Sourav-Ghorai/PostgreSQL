import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
   user: "postgres",
   host: "localhost",
   database: "world",
   password: "database@1947",
   port: 5432,
})

db.connect();

async function markVisited(){
   const result = await db.query("SELECT country_code FROM visited_countries");
   let codes = [];
   result.rows.forEach((item) => {
   codes.push(item.country_code);
   });
   return codes;
}

app.get("/", async (req, res) => {
   const codes = await markVisited();
   res.render("index.ejs",{total: codes.length, countries: codes});
});

app.post("/add", async (req, res) => {
   const input = req.body["country"];
   
   try {
      const result = await db.query(
         "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
         [input.toLowerCase()]
      );
      const countryCode = result.rows[0].country_code;
      try{
         await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
            countryCode,
          ]);
          res.redirect("/");
      }catch(err){
         // console.log(err);
         const countries = await markVisited();
         res.render("index.ejs", {
            total: countries.length, 
            error: "Country has already been added, try again.",
            countries: countries
         })
      }
   }catch(err){
      // console.log(err);
      const countries = await markVisited();
      res.render("index.ejs", {
         total: countries.length, 
         error: "Country name does not exist, try again.",
         countries: countries
      })
   }
 });


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
