const mongoose = require('mongoose');

const data = {
  amount: 10,
  spentBy: '65fbd3b98ea6f862db4ccf1e' // mock ObjectId
};

const obj = {
  ...data,
  spentBy: new mongoose.Types.ObjectId(data.spentBy)
};

console.log(typeof obj.spentBy, obj.spentBy instanceof mongoose.Types.ObjectId);
