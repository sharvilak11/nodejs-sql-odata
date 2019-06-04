module.exports = function(sequelize,DataTypes){
    var Audit = sequelize.define('Audit', {
        Id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        AuditDate:{
            type: DataTypes.DATE
        }
    }, {
        timestamps: false
    });

    return Audit;
}