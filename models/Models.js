module.exports = function(sequelize,Sequelize){
    return {
        Customers: require('./Customer')(sequelize,Sequelize),
        Accounts: require('./Account')(sequelize,Sequelize),
        Audits: require('./Audit')(sequelize,Sequelize)
    }
}