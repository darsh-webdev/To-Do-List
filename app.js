//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://newbiedev:darshan@gettingstarted.n44sg.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({ 
  item: {
    type: String, 
    required: [true, "Please check data entry, no item specified!"]
  }
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({ 
  item: "Welcome to your To-Do List!"
});

const item2 = new Item ({ 
  item: "Click on '+' to add a new item"
});

const item3 = new Item ({ 
  item: "← Click on this to remove an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: [true, "Please check data entry, no item specified!"]
  },
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if(items.length === 0){ 
      Item.insertMany(defaultItems, function (err){
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully Added Default Items to DB");
        }
      });
      res.redirect("/");
    } else { 
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });

});


app.get("/:customListName", function(req,res){
  const requestedTitle = _.capitalize(req.params.customListName);

  List.findOne({name: requestedTitle}, function(err, result){
    if(!err){

      if(!result){ 
      //Create New List
      const list = new List ({ 
        name: requestedTitle, 
        items: defaultItems
        });

        list.save();
        res.redirect("/" + requestedTitle);
      } else {
      //Show existing List
      res.render("list", {listTitle: result.name, newListItems: result.items});
      } 
    }
    
  });
  
  
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    item: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else { 
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});

app.post('/delete', function(req, res) {
  
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){ 
    Item.findByIdAndRemove(checkedItemID, function(err){ 
    if(err) {
      console.log(err);
    } else {
      console.log("Successfully removed item from DB");
    }
  });
  res.redirect("/");
  } else { 

    List.findOneAndUpdate(
      {
        name: listName
      },
      {
        $pull: {items: {_id: checkedItemID} }
      }, function(err, result){ 
        if(!err){
          res.redirect("/" + listName);
        }
      }
    );
  }


});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
