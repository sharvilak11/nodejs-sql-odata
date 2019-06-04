var _functionsParser = require('./helperFunctions');
const {Op} = require('sequelize');

function selectExpandParser(options, selected, expanded, Model) {
    var sequelize = Model.sequelize;
    if (selected) {
        var selectedArray = selected.split(',');
        if(expanded) {
            options.include = [];
            var tree = _buildTree(expanded,Model,sequelize);
            options.include = _iterate(tree,sequelize,[]);
            // options.include = expanded.split(',').map(function (e) {
            //     return Model.attributes[e.trim()].references.model
            // });
        }
        options.attributes = selectedArray;
    }
    else {
        if(expanded) {
            options.include = [];
            options.include = expanded.split(',').map(function (e) {
                return e.trim()
            });
        }
    }
    return options;
}

var _buildTree = function buildTree(expand,Model,sequelize) {
    var expands = expand.split(',');
    var tree = {};
    for(var i=0; i < expands.length; i++){
        _buildSubTrees(expands[i],tree,Model,sequelize);
    }
    return tree;
};

var _buildSubTrees = function(branch,tree,Model,sequelize){
    if(!branch)
        return;
    var branches = branch.split('.');
    if(!tree[Model.attributes[branches[0]].references.model]){
        tree[Model.attributes[branches[0]].references.model] = {};

    }
    _buildSubTrees(branches[1],tree[Model.attributes[branches[0]].references.model],sequelize.models[Model.attributes[branches[0]].references.model],sequelize);
}

function _iterate(obj,sequelize, tree){
    for(var prop in obj){
        if(obj.hasOwnProperty(prop)){
           if(Object.getOwnPropertyNames(obj[prop]).length > 0){
               tree.push({
                   model: sequelize.models[prop],
                   include: []
               });
               _iterate(obj[prop],sequelize,tree[tree.length - 1].include);
           }
           else{
               tree.push(sequelize.models[prop]);
           }
        }
    }
    return tree;
}


function filterParser(options, $filter){
    if (!$filter) {
        return;
    }

    options.where = {};

    var SPLIT_MULTIPLE_CONDITIONS = /(.+?)(?:and(?=(?:[^']*'[^']*')*[^']*$)|$)/g;
    var SPLIT_KEY_OPERATOR_AND_VALUE = /(.+?)(?: (?=(?:[^']*'[^']*')*[^']*$)|$)/g;
    var SPLIT_MULTIPLE_OR_CONDITIONS = /(.+?)(?:or(?=(?:[^']*'[^']*')*[^']*$)|$)/g;

    var condition = undefined;
    var conditionOr = [];
    if (_functionsParser.stringHelper.has($filter, 'and')) {
        condition = $filter.match(SPLIT_MULTIPLE_CONDITIONS).map(function (s) {
            return _functionsParser.stringHelper.removeEndOf(s, 'and').trim();
        });
    } else if(_functionsParser.stringHelper.has($filter, 'or')){
        options.where[Op["or"]] = [];
        conditionOr = $filter.match(SPLIT_MULTIPLE_OR_CONDITIONS).map(function (s) {
            return _functionsParser.stringHelper.removeEndOf(s, 'or').trim();
        });
    }else {
        condition = [$filter.trim()];
    }

    for (var i = 0; condition && i < condition.length; i++) {
        var item = condition[i];
        var conditionArr = item.match(SPLIT_KEY_OPERATOR_AND_VALUE).map(function (s) {
            return s.trim();
        }).filter(function (n) {
            return n;
        });
        if (conditionArr.length !== 3) {
            return new Error('Syntax error at \'#{item}\'.');
        }

        var _conditionArr = _functionsParser.slicedToArray(conditionArr, 3);

        var key = _conditionArr[0];
        var odataOperator = _conditionArr[1];
        var value = _conditionArr[2];

        if(!options.where[key]){
            options.where[key] = {};
        }

        if(['between','notBetween','in','notIn','overlap','contains','contained','any'].indexOf(odataOperator) > -1){
            var splitValues = value.split(',');
            options.where[key][Op[odataOperator]] = splitValues;
        }
        else if(['gt','gte','lt','lte','ne','like','notLike'].indexOf(odataOperator) > -1){
            value = _functionsParser.validator.formatValue(value);
            options.where[key][Op[odataOperator]] = value;
        }
        else if(odataOperator = 'eq'){
            value = _functionsParser.validator.formatValue(value);
            options.where[key] = value;
        }
        else{
            return new Error('Incorrect operator at \'#{item}\'.');
        }
    }
    for (var i = 0; i < conditionOr.length; i++) {
        var item = conditionOr[i];
        var conditionArr = item.match(SPLIT_KEY_OPERATOR_AND_VALUE).map(function (s) {
            return s.trim();
        }).filter(function (n) {
            return n;
        });
        if (conditionArr.length !== 3) {
            return new Error('Syntax error at \'#{item}\'.');
        }

        var _conditionArr = _functionsParser.slicedToArray(conditionArr, 3);

        var key = _conditionArr[0];
        var odataOperator = _conditionArr[1];
        var value = _conditionArr[2];

        value = _functionsParser.validator.formatValue(value);

        if(['between','notBetween','in','notIn','overlap','contains','contained','any'].indexOf(odataOperator) > -1){
            var splitValues = value.split(',');
            var obj = {
                [key]: {
                    [Op[odataOperator]] : splitValues
                }
            };
            options.where[Op["or"]].push(obj);
        }
        else if(['gt','gte','lt','lte','ne','like','notLike'].indexOf(odataOperator) > -1){
            var obj = {
                [key]: {
                    [Op[odataOperator]] : value
                }
            };
            options.where[Op["or"]].push(obj);
        }
        else if(odataOperator == 'eq'){
            var obj = {
                [key]: value
            }
            options.where[Op["or"]].push(obj);
        }
        else{
            return new Error('Incorrect operator at \'#{item}\'.');
        }
    }

    return options;
}

function topParser(options,top){
    if (top > 0) {
        options.limit = parseInt(top);
        return options
    } else
        return options;
}

function skipParser(options,skip){
    if (skip > 0) {
        options.offset = parseInt(skip);
        return options;
    } else
        return options;
}

function orderByParser(options, orderBy){
    if (!orderBy) {
        return;
    }

    var order = [];
    var orderbyArr = orderBy.split(',');

    orderbyArr.map(function (item) {
        var data = item.trim().split(' ');
        if (data.length > 2) {
            return new Error('odata: Syntax error at \'' + orderBy + '\', it should be like \'ReleaseDate asc, Rating desc\'');
        }
        var key = data[0].trim();
        var value = data[1] || 'ASC';
        order.push([key,value]);
    });
    options.order = order;
    return options;
}

module.exports = {
    selectExpandParser,
    filterParser,
    topParser,
    skipParser,
    orderByParser
};