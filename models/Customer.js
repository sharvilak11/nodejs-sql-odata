module.exports = function(sequelize,DataTypes){
    var Account = require('./Account')(sequelize,DataTypes);
    var Customer = sequelize.define('Customer', {
        Id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        DateOfBirth: {
            type: DataTypes.DATE
        },
        IsPrime: {
            type: DataTypes.INTEGER
        },
        AccountId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Account',
                key: 'Id'
            }
        }
    }, {
        timestamps: false
    });
    Customer.belongsTo(Account, {foreignKey: 'AccountId', targetKey: 'Id'});
    return Customer;
}