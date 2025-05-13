const mongoose = require('./db')

const shop = new mongoose.Schema({
    name: String,
    price: Number,
    imgs: String,
    title:String,
    tname:String
});


const shopModel = mongoose.model("shop", shop, "shop");


module.exports = {

    shopModel,

}
