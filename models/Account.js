module.exports = function(sequelize,DataTypes){
    var Audit = require('./Audit')(sequelize,DataTypes);
    var Account = sequelize.define('Account', {
        Id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        AccountHolderName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Country: {
            type: DataTypes.STRING
        },
        AuditId:{
            type: DataTypes.INTEGER,
            references: {
                model: 'Audit',
                key: 'Id'
            }
        }
    }, {
        timestamps: false
    });

    Account.belongsTo(Audit, {foreignKey: 'AuditId', targetKey: 'Id'});
    return Account;
}