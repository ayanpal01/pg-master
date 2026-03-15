const mongoose = require('mongoose');
const s = new mongoose.Schema({ name: String });
const M = mongoose.model('M', s);
const doc = new M({ _id: new mongoose.Types.ObjectId(), name: "test" });
console.log(doc.toString());
console.log(typeof doc.toString());
