class ApiFeature {
    constructor(query , queryStr){
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword ? {
            name : {
                $regex : this.queryStr.keyword,
                $options : 'i',
            }
        } : {}
        this.query = this.query.find({...keyword});
        return this;
    }

    filter() {
        const queryCopy = {...this.queryStr};
        const removeField = ["keyword" , "page" , "limit"];

        removeField.forEach(e => delete queryCopy[e]);

        let querystr = JSON.stringify(queryCopy);

        querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g , key => `$${key}`)

        this.query = this.query.find(JSON.parse(querystr))

        return this
    }

    
    pagination(results) {
        const CurrPage = Number(this.queryStr.page) || 1;

        const skip = results * (CurrPage - 1);

        this.query = this.query.limit(results).skip(skip);

        return this
    }

}

module.exports = ApiFeature;