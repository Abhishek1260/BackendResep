const express = require('express')
const router = express.Router()
const location = require('../models/LocationModelForView')

//route to add the User Details
router.post('/Location/get' , async (req , res) => {
    try {
        const {state , city} = req.body
        const Location = await location.findOne({state : state});
        const newArr = [
            {
                cityName : city ,
                count : 1
            }
        ]
        if (!Location) {
            const LocationCreate = await location.create({
                state : state , 
                city : newArr
            })
            return res.status(200).json({success : true , message : "location added"})
        }
        for (let i = 0 ; i < Location.city.length ; i++ ) {
            if (Location.city[i].cityName === city) {
                Location.city[i].count += 1;
                await Location.save()
                return res.status(200).json({success : true , message : "count increased"})
            }
        }
        const newDict = {
            cityName : city , 
            count : 1
        }
        Location.city.push(newDict)
        await Location.save();
        return res.status(200).json({success : true , message : "city added"})
    } catch (error) {
        return res.status(500).json({success : false , message : "internal server error"})
    }
})

module.exports = router