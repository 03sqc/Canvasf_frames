const mongoose = require('mongoose')

    mongoose.connect('mongodb://127.0.0.1:27017/20250214')
    .then(res => {
        console.log('OK');
    })
    .catch(err => {
        console.log('NO');

    })
module.exports = mongoose