import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "familyTravel",
  password: "database@1947",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function getUsers(){
   let users = [];
   const result = await db.query("SELECT * FROM users")
   users = result.rows;
   return users;
}

async function checkVisited(id) {
   const result = await db.query(
     "SELECT country_code " +
     "FROM family_travel " +
     "JOIN users ON family_travel.user_id = users.id " +
     "JOIN visited_countries ON family_travel.country_id = visited_countries.id " +
     "WHERE users.id = $1",
     [id]
   );
   
   let countries = [];
   // console.log(result.rows)
   result.rows.forEach((country) => {
     countries.push(country.country_code);
   });
   return countries;
 }
 

app.get("/", async (req, res) => {
  const countries = await checkVisited(currentUserId);
  const users = await getUsers();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
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
      await db.query(
         "INSERT INTO visited_countries (country_code) VALUES ($1)",
         [countryCode]
       );
      const result = await db.query("SELECT id FROM visited_countries WHERE country_code = $1", [countryCode])
      // console.log(result.rows);
      const countryCodeId = result.rows[0].id;
      await db.query("INSERT INTO family_travel(user_id, country_id) VALUES ($1, $2)", [currentUserId, countryCodeId]);
      res.redirect("/");
    }catch(err){
      console.log(err);
    }
    

   //  try {
   //    await db.query(
   //      "INSERT INTO visited_countries (country_code) VALUES ($1)",
   //      [countryCode]
   //    );
   //    res.redirect("/");
   //  } catch (err) {
   //    console.log(err);
   //  }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
   if(req.body.user){
      currentUserId = parseInt(req.body.user);
      const countries = await checkVisited(currentUserId);
      const users = await getUsers();
      res.render("index.ejs", {
         countries: countries,
         total: countries.length,
         users: users,
         color: "teal",
       });
   }else{
      res.render("new.ejs");
   }
   
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
//   console.log(req.body);
   try{
      const name = req.body.name
      const color = req.body.color
      await db.query("INSERT INTO users(name, color) VALUES ($1, $2)", [name, color])
      const result = await db.query("SELECT id FROM users WHERE name = $1", [name]);
      currentUserId = result.rows.id;
      const countries = await checkVisited(currentUserId);
      const users = await getUsers();
      res.render("index.ejs", {
         countries: countries,
         total: countries.length,
         users: users,
         color: "teal",
       });
   }catch(err){
      console.log(err);
   }
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
