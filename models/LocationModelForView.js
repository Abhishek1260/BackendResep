const mongoose = require('mongoose')

const LocationViewerSchema = new mongoose.Schema({
    state : {
        type : String ,
        required : true ,
    } ,
    city : [
        {
            cityName : {
                type : String ,
                required : true
            } ,
            count : {
                type : Number ,
                required : true ,
                default : 0
            }
        }
    ]
})

module.exports = mongoose.model("LocationView" , LocationViewerSchema)