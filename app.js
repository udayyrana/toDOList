const express = require("express");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require('lodash');
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "My TODO List",
});
const item2 = new Item({
  name: "Learn DSA",
});

const defaultItems = [item1, item2];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("Successfully inserted in DB!");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        res.redirect("/" + customListName);
        list.save();
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/delete", function (req, res) {
  const checkbox = req.body.checkbox;
  let listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkbox, function (err) {
      if (err) console.log(err);
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkbox } } },
      function (err, foundList) {
        if (err) console.log(err);
        res.redirect("/" + listName);
      }
    );
  }
});

app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  let listName = req.body.list;
  let item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      res.redirect("/" + listName);
      foundList.save();
    });
  }
});

app.listen(3000, function () {
  console.log("Server Started at 3000.");
});
