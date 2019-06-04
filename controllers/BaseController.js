var odata = require('../odata');
var sequelize = require('sequelize')

module.exports = function (Model) {
    function getAll(req, res) {
        // var TenantIds = req.user.Claims.filter(
        //     //filter all the TenantIds From the Claim
        //     function (c) {
        //         return c.Name == "Tenant";
        //     }).map(
        //     //Reduce the Arrays to just the TenantIds
        //     function (c) {
        //         return c.Value
        //     });
        //
        // //query string that filters just the records with the selected Tenants or no tenant all together
        // var querystring = [{
        //     Tenant: {
        //         $in: TenantIds
        //     }
        // }, {
        //     Tenant: {
        //         $exists: false
        //     }
        // }, {
        //     Tenant: {
        //         $eq: null
        //     }
        // }];

        var options = {
            raw: true
        }

        if (req.query.$select || req.query.$expand)
            options = odata.selectExpandParser(options, req.query.$select, req.query.$expand, Model);

        if (req.query.$filter)
            options = odata.filterParser(options, req.query.$filter);

        if (req.query.$top)
            options = odata.topParser(options, req.query.$top);

        if (req.query.$skip)
            options = odata.skipParser(options, req.query.$skip);

        if (req.query.$orderBy)
            options = odata.orderByParser(options, req.query.$orderBy);

        var query = Model.findAll(options);

        query.then(function (models) {
            res.status(200).json(models);
        }, function (err) {
            res.status(500).send(err);
        });
    }

    function count(req, res) {

        var options = {
            raw: true
        }

        if (req.query.$filter)
            options = odata.filterParser(options, req.query.$filter);

        var query = Model.count(options);
        query.then(function (count) {
            res.status(200).json({Count: count});
        }, function (err) {
            return res.status(500).send(err);
        });
    }

    function getOne(req, res) {
        if (!Model.primaryKeys || !Model.primaryKeyAttribute) {
            return res.status(400).json({
                error: 'No Primary Key found'
            })
        }
        var type = Model.tableAttributes[Model.primaryKeyAttribute].type.constructor.key
        var id;
        if (type == 'INTEGER') {
            id = parseInt(req.params.Id);
        }
        else if (type == 'STRING') {
            id = req.params.Id;
        }
        else {
            res.status(400).json({
                error: 'ODATA doesnt support non INTERGER and non STRING Primary Key'
            })
        }
        Model.findById(id, {raw: true}).then(function (model) {
            if (model)
                res.json(model);
            else
                res.status(404).json({
                    error: 'Not Found'
                });
        }, function (err) {
            res.status(500).send({
                error: err
            })
        })
    }

    function postNew(req, res) {
        var data = Model.build(req.body);
        // data.AuditInfo = {};
        // data.AuditInfo.CreatedByUser = req.user._id;

        data.save().then(function (savedData) {
            savedData.reload().then(function (saved) {
                res.status(200).json(saved.dataValues);
            }, function (err) {
                return res.status(500).json(err);
            })
        }, function (err) {
            res.status(500).send(err);
        });
    }

    function postBulk(req, res) {
        var items = req.body.Items;
        Model.bulkCreate(items).then(function () {
            res.send("Inserted")
        }, function (err) {
            res.json(err);
        })
    }

    function putUpdate(req, res) {
        if (!Model.primaryKeys || !Model.primaryKeyAttribute) {
            return res.status(400).json({
                error: 'No Primary Key found'
            })
        }
        var type = Model.tableAttributes[Model.primaryKeyAttribute].type.constructor.key
        var id;
        if (type == 'INTEGER') {
            id = parseInt(req.body[Model.primaryKeyAttribute]);
        }
        else if (type == 'STRING') {
            id = req.body[Model.primaryKeyAttribute];
        }
        else {
            res.status(400).json({
                error: 'ODATA doesnt support non INTERGER and non STRING Primary Key'
            })
        }

        var updateObj = {};
        for (var field in req.body) {
            if (Model.tableAttributes[field] && field != Model.primaryKeyAttribute) {
                updateObj[field] = req.body[field];
            }
        }
        var where = {
            where: {
                [Model.primaryKeyAttribute]: id
            }
        };

        Model.update(updateObj, where).then(function (savedData) {
            if (!savedData || savedData[0] == 0) {
                res.status(404).send({
                    error: 'Object Not Found'
                });
            }
            Model.findById(id, {raw: true}).then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                return res.status(500).send(err);
            })
        }, function (err) {
            return res.status(200).json(err);
        })
    }

    function deleteOne(req, res) {
        if (!Model.primaryKeys || !Model.primaryKeyAttribute) {
            return res.status(400).json({
                error: 'No Primary Key found'
            })
        }
        var type = Model.tableAttributes[Model.primaryKeyAttribute].type.constructor.key
        var id;
        if (type == 'INTEGER') {
            id = parseInt(req.query[Model.primaryKeyAttribute]);
        }
        else if (type == 'STRING') {
            id = req.body[Model.primaryKeyAttribute];
        }
        else {
            res.status(400).json({
                error: 'ODATA doesnt support non INTERGER and non STRING Primary Key'
            })
        }

        var where = {
            where: {
                [Model.primaryKeyAttribute]: id
            }
        };

        Model.destroy(where).then(function(){
            res.status(200).send("Deleted");
        }, function(err){
            return res.status(500).send(err);
        })
    }

    var controller = {
        get: getAll,
        count: count,
        getById: getOne,
        post: postNew,
        postBulk: postBulk,
        put: putUpdate,
        delete: deleteOne
    };

    return controller;
}