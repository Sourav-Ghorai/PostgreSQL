import express from "express";
import pg from "pg"
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
   user: "postgres",
   host: "localhost",
   database: "todoList",
   password: "database@1947",
   port: 5432,
 });
 db.connect();

async function getItem(){
   const result = await db.query("SELECT * FROM items")
   return result.rows;
}

app.get("/", async (req, res) => {
   let items = await getItem();
   res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
   });
});

app.post("/add",async (req, res) => {
   const item = req.body.newItem;
   await db.query("INSERT INTO items(title) VALUES($1)",[item])
   res.redirect("/");
});

app.post("/edit", async (req, res) => {
   const item = req.body.updatedItemTitle
   const id = req.body.updatedItemId
   await db.query("UPDATE items SET title = $1 WHERE id = $2",[item, id])
   res.redirect("/")
});

app.post("/delete", async (req, res) => {
   const id = req.body.deleteItemId;
   await db.query("DELETE FROM items WHERE id = $1",[id]);
   res.redirect("/")
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
